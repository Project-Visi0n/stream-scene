// server/services/threadsApi.ts
import type { RequestInit } from 'node-fetch'; // only for types; Node 20 has global fetch

const THREADS_GRAPH_BASE = process.env.THREADS_GRAPH_BASE || 'https://graph.threads.net';
const THREADS_API_VERSION = process.env.THREADS_API_VERSION || 'v1.0';

type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO';

export type CreateContainerParams = {
  userId: string;           // Threads user ID (or "me")
  accessToken: string;      // Threads Graph user token
  text?: string;
  imageUrls?: string[];     // For IMAGE posts: first URL used
  videoUrl?: string | null; // For VIDEO posts
  altText?: string;
  replyToId?: string;
  replyControl?: 'everyone' | 'accounts_you_follow' | 'mentioned_only';
  linkAttachment?: string;  // Attach a URL to the post
  quotePostId?: string;     // Quote an existing post
  allowlistedCountryCodes?: string[]; // ISO 3166-1 alpha-2
};

export type PublishParams = {
  userId: string;
  accessToken: string;
  creationId: string;
};

export type CreateAndPublishParams = Omit<CreateContainerParams, 'imageUrls'> & {
  imageUrls?: string[];
};

/**
 * Helper to POST form-encoded to Graph API.
 */
async function graphPost(
  path: string,
  body: Record<string, any>,
  init?: RequestInit
) {
  const url = `${THREADS_GRAPH_BASE}/${THREADS_API_VERSION}${path}`;
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      // Graph expects arrays as JSON strings for some fields
      form.append(k, JSON.stringify(v));
    } else {
      form.append(k, String(v));
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    ...init,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = json?.error?.message || JSON.stringify(json);
    throw new Error(`Graph POST ${path} ${res.status}: ${errMsg}`);
  }
  return json;
}

/**
 * Helper to GET from Graph API.
 */
async function graphGet(path: string, params: Record<string, any>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.append(k, String(v));
  }
  const url = `${THREADS_GRAPH_BASE}/${THREADS_API_VERSION}${path}?${usp.toString()}`;

  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = json?.error?.message || JSON.stringify(json);
    throw new Error(`Graph GET ${path} ${res.status}: ${errMsg}`);
  }
  return json;
}

/**
 * Create a media container for TEXT/IMAGE/VIDEO.
 * Returns the container creation id.
 */
export async function createMediaContainer(params: CreateContainerParams): Promise<{ id: string }> {
  const {
    userId,
    accessToken,
    text,
    imageUrls,
    videoUrl,
    altText,
    replyToId,
    replyControl,
    linkAttachment,
    quotePostId,
    allowlistedCountryCodes,
  } = params;

  let media_type: MediaType = 'TEXT';
  const payload: Record<string, any> = {
    access_token: accessToken,
    media_type,
    text,
    alt_text: altText,
    reply_to_id: replyToId,
    reply_control: replyControl,
    link_attachment: linkAttachment,
    quote_post_id: quotePostId,
    allowlisted_country_codes: allowlistedCountryCodes,
  };

  // Decide media type + required fields
  if (videoUrl) {
    media_type = 'VIDEO';
    payload.media_type = 'VIDEO';
    payload.video_url = videoUrl;
  } else if (imageUrls && imageUrls.length > 0) {
    media_type = 'IMAGE';
    payload.media_type = 'IMAGE';
    payload.image_url = imageUrls[0]; // Threads API accepts single image_url here
  } else {
    media_type = 'TEXT';
    payload.media_type = 'TEXT';
    if (!text || !text.trim()) {
      throw new Error('TEXT posts require a non-empty "text" param.');
    }
  }

  const json = await graphPost(`/${encodeURIComponent(userId)}/threads`, payload);
  // Example response: { id: "<creation_id>" }
  if (!json?.id) throw new Error('No container id returned from Threads API.');
  return { id: json.id };
}

/**
 * Poll container status until it is ready (or fails/timeout).
 * Threads container status exposes fields: id, status, error_message.
 */
export async function waitForContainerReady(
  creationId: string,
  accessToken: string,
  {
    intervalMs = 2000,
    timeoutMs = 120000, // 2 minutes for videos
  }: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<{ status: string }> {
  const started = Date.now();

  while (true) {
    const json = await graphGet(`/${encodeURIComponent(creationId)}`, {
      access_token: accessToken,
      fields: 'id,status,error_message',
    });

    const status = (json?.status || '').toUpperCase();
    if (status === 'FINISHED' || status === 'READY' || status === 'PUBLISHED') {
      return { status };
    }
    if (status === 'ERROR' || json?.error_message) {
      throw new Error(`Container error: ${json?.error_message || status}`);
    }

    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timeout waiting for container to be ready (last status: ${status || 'unknown'})`);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

/**
 * Publish the prepared container.
 */
export async function publishContainer(params: PublishParams): Promise<{ id?: string }> {
  const { userId, accessToken, creationId } = params;
  const json = await graphPost(`/${encodeURIComponent(userId)}/threads_publish`, {
    access_token: accessToken,
    creation_id: creationId,
  });
 
  return json;
}

/**
 * Convenience: create container -> (wait) -> publish
 */
export async function createAndPublish(params: CreateAndPublishParams): Promise<{ id?: string; creationId: string }> {
  const { userId, accessToken, ...rest } = params;

  const { id: creationId } = await createMediaContainer({ userId, accessToken, ...rest });

  
  await waitForContainerReady(creationId, accessToken);

  const published = await publishContainer({ userId, accessToken, creationId });
  return { ...published, creationId };
}
