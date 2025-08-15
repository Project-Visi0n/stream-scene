
export async function getThreadsStatus() {
  const res = await fetch('/api/threads/status', { credentials: 'include' });
  if (!res.ok) return { connected: false };
  return res.json(); // { connected: boolean, accountId?: string, username?: string }
}

export async function upsertThreadsToken(payload: { accountId: string; accessToken: string; expiresAt?: string }) {
  const res = await fetch('/api/threads/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Token upsert failed');
  return res.json();
}

export async function scheduleThreadsPost(payload: {
  accountId: string;
  text: string;
  media?: { imageUrls?: string[]; videoUrl?: string | null };
  scheduledFor: string; // ISO
}) {
  const res = await fetch('/api/threads/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Schedule failed');
  return data; // { ok: true, post }
}

export async function publishThreadsNowById(id: number) {
  const res = await fetch(`/api/threads/publish-now/${id}`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Publish-now failed');
  return data; 
}
