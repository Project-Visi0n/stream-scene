# StreamScene — Interview Q&A (Tech & Implementation)

This document contains 20 interview-style questions and expanded answers about StreamScene's architecture, technology choices, implementation details, and operational considerations. Use these as talking points during interviews or as internal documentation.

---

## 1) What's the overall architecture of StreamScene?

StreamScene is a full-stack TypeScript application with a single-page React (v19) frontend and a TypeScript/Node.js Express backend. The frontend is bundled with Webpack and styled with Tailwind CSS. The backend exposes REST endpoints for auth, file handling, scheduling, and integrations. Persistent storage uses MySQL accessed through Sequelize (with sequelize-typescript). Media storage uses AWS S3 and processing uses fluent-ffmpeg and AWS Transcribe where applicable. The app runs both client and server concurrently during development and supports a production build and node-based server start.

**Why this matters:** This separation keeps the UI fast and responsive while allowing the server to handle processing-intensive tasks and secure integrations.

---

## 2) Why TypeScript, and how is it used across the stack?

TypeScript minimizes runtime errors and provides a strong contract between components. StreamScene applies TypeScript on both client and server to ensure shared types when feasible, improve IDE autocompletion, and catch type errors earlier in development.

We use `ts-node`/`tsx` for local development to run TypeScript directly, and compile the server with `tsc` for production builds. The repo also includes `@types/*` dev dependencies so third-party libraries are typed where community types exist.

**Talking points:** Mention examples like `Task` types in `client/types/task.ts` and Sequelize model types under `server/models` to show how types enforce correctness.

---

## 3) How is routing handled on frontend and backend?

- Frontend: `react-router-dom` provides client-side routing for SPA pages (landing, planner, project center, etc.). Routes are defined in `client/components/App.tsx` and components are lazy-loadable for performance.
- Backend: Express routes are organized under `server/routes/*`. Each route file focuses on a domain (auth, files, schedules). Middleware handles authentication and input validation before controllers interact with models.

**Interview tip:** Explain the benefits of client-side routing (snappy navigation, stateful UI) and how you protect server routes with middleware.

---

## 4) How is authentication implemented?

We use Passport.js with strategies for Google OAuth2 (`passport-google-oauth20`) and Twitter (`passport-twitter`). Sessions are managed via `express-session`. After OAuth handshake, the server stores user metadata and social tokens in models (e.g., `SocialAccountToken`). Protected endpoints use middleware to verify the session and attach the user object.

**Security note:** Always store the minimum token info needed, rotate credentials, and avoid exposing tokens to the client when not necessary.

---

## 5) How do you handle file uploads and storage?

Uploads are accepted via `multer` middleware. Files are temporarily received by the server, validated, and then uploaded to S3 using the AWS SDK v3 (`@aws-sdk/client-s3`). Metadata (original filename, content type, S3 key, owner) is stored in the database. For file delivery we use presigned URLs to avoid direct public exposure.

**Performance tip:** For very large files use S3 multipart upload or client-side direct uploads (presigned) to reduce server bandwidth.

---

## 6) How is media processing handled (transcoding, captions)?

We leverage `fluent-ffmpeg` for server-side media transcoding (converting, trimming, extracting thumbnails). For speech-to-text we use AWS Transcribe; OCR uses `tesseract.js` for images. Heavy jobs can be queued and processed outside of request-response cycles to avoid blocking.

**Scaling note:** Offload to background workers or serverless functions if processing becomes a bottleneck.

---

## 7) Why Webpack, and what's special about the configuration?

Webpack gives explicit control over asset bundling and transformations. The repo includes a `webpack.config.mjs` with separate dev/prod modes and integrations for PostCSS/Tailwind, lightningcss optimizations, and HTML generation. Code-splitting and hashed asset names are used in production to improve caching.

**Alternate:** Vite would be faster for dev, but Webpack offers richer plugin ecosystem and fine-grained control we leveraged here.

---

## 8) How is Tailwind integrated and customized?

Tailwind is included via PostCSS. `client/styles/tailwind.css` imports Tailwind and contains custom utility classes for mobile behavior, gradients, scroll fixes, and app-specific UI tokens. We keep component styles using utility classes to keep CSS localized and predictable.

**Example:** Custom utilities handle iOS bounce-scroll fixes and mobile tap targets.

---

## 9) How are environment variables and secrets managed?

We use `dotenv` for local development and rely on environment variables injected at runtime for production (CI/CD, cloud provider secrets manager, or instance-level env). Sensitive keys (OAuth client secrets, AWS keys) are never stored in the repo.

**Best practice:** Use a secrets manager for production (e.g., AWS Secrets Manager) and rotate keys regularly.

---

## 10) How are scheduled jobs and background tasks implemented?

We use `node-cron` for cron-like scheduled tasks (e.g., sending scheduled posts). For heavier async workloads we recommend using a queue system (Redis + Bull) or serverless cron to scale reliably. The current approach is sufficient for light scheduling and development.

---

## 11) Describe the database design and ORM usage.

MySQL with Sequelize (sequelize-typescript) models the domain: Users, Files, Shares, Tasks, ScheduledPosts, SocialAccountToken, etc. Models include relations (hasMany, belongsTo) and timestamps. Migrations and seeds are handled via `sequelize-cli` and `server/db/seed.ts`.

**Interview tip:** Point to a particular model and describe fields and associations to show domain understanding.

---

## 12) How do you structure API responses and DTOs?

Server endpoints return compact DTOs: sanitize models, exclude sensitive fields, and return explicit shapes. We validate input and map DB models to response DTOs to avoid leaking internal structure. This makes clients resilient to server-side refactors.

---

## 13) How is shareable link security implemented?

Shares are stored with metadata and a token. When a request comes in with a share token, the server validates token expiration and permissions before returning presigned S3 URLs or file content. Tokens are time-limited and revocable.

**Security detail:** Prefer HMAC-signed tokens in production for verifiability.

---

## 14) How do you test interactive UI pieces (canvas, audio)?

Visual and integration testing are preferred: use Jest + React Testing Library for components and manual/visual checks for canvas/audio. We isolate complexity in small components (react-sketch-canvas, Wavesurfer integration) and expose small APIs for unit testing.

**Next step:** Add E2E tests (Cypress) for full flows (upload → process → share).

---

## 15) What performance optimizations are in place?

- Code-splitting and lazy-loading heavy components.  
- S3 for media offloading.  
- Tailwind with production purge to keep CSS small.  
- Cached presigned URLs rather than re-signing each request where safe.

**Further:** Add CDN (CloudFront) for global media delivery and more aggressive server-side caching.

---

## 16) How are API endpoints secured and validated?

Auth middleware checks sessions before protected endpoints run. Input validation (lightweight) and file content-type checking prevent misuse. For public endpoints we rate-limit or add throttling where needed.

**Improvement:** Add structured validation with `zod` or `Joi` and introduce rate-limiting middleware.

---

## 17) What mobile-specific UX fixes were required?

Mobile fixes include larger touch targets, `-webkit-overflow-scrolling: touch`, and an iOS bounce-scroll background fix (app gradient applied to `html, body`, and `#root` scroll handling). We also added CSS utilities for viewport height handling on mobile.

**Talking point:** Explaining the iOS bounce issue shows attention to platform nuances.

---

## 18) Tell me about a hard bug and how you resolved it.

Symptom: iOS Safari revealed white areas when a user "bounced" past the top/bottom of the page. Root cause: only the app container had the gradient; the browser's overscroll used the root document background (white). Fix: apply the gradient to `html` and `body`, add iOS-specific `@supports` rules to make `#root` scrollable and `-webkit-overflow-scrolling: touch` so the visual remains consistent during overscroll.

**Why it matters:** Small UX details are crucial for perceived product quality.

---

## 19) How are third-party APIs integrated (Google/Twitter)?

We abstract each external API into service modules. Google generative AI uses `@google/generative-ai` for content features. Twitter integration uses `twitter-api-v2`. Server acts as a proxy for sensitive operations so client secrets are never exposed.

**Note:** Use retry/backoff for flaky API calls and circuit breakers for resilience.

---

## 20) What would you prioritize next to improve the project?

- Add test coverage (unit + E2E).  
- Move heavy media processing to a worker queue.  
- Add CI with lint/test/build pipelines.  
- Adopt a typed shared package for client/server DTOs.  
- Introduce CDN and signed cookies for media distribution.

---

### Usage
- File created at `docs/INTERVIEW_QA_STREAMSCENE.md`. Use this as interview prep or internal docs.

If you want shorter bullet answers, export-ready slides, or a one-page summary, I can produce those next.

---

## Resume-specific questions

Below are targeted interview questions and model answers focused on the exact resume bullets you provided. These probe for depth on your implementation choices and trade-offs.

### A) Full-stack TypeScript app with React and Express

Q: You mention a "full-stack TypeScript web application" — how did you structure shared types and handle TypeScript configuration across client and server?

A: I keep types close to their consumers but extract stable DTOs and small shared interfaces into a convention-based `types/` area. For example, UI-facing `Task` shapes live under `client/types`, while Sequelize models use `server/models` with typed interfaces. For cross-boundary DTOs (API payloads), I maintain concise interfaces that server controllers map to/from models, avoiding leaking ORM internals to the client. Development uses `ts-node/tsx` for iteration; production compiles server code with `tsc`.

Q: What trade-offs did you consider when choosing React + Webpack + Tailwind for the frontend?

A: React provides rich ecosystem and state management flexibility. Webpack gave us fine-tuned control for code-splitting, loaders, and production caching. Tailwind speeds up UI development and enforces consistent design tokens. The trade-off is build complexity; to mitigate that we codified the config and added helper scripts to keep builds deterministic.

### B) Real-time HTML5 Canvas editor (react-sketch-canvas)

Q: How did you implement real-time drawing sync and the custom tools (color picker, brush sizes)?

A: The drawing surface uses `react-sketch-canvas` for core path capture and local undo/redo. I expose a small API wrapper to serialize drawing paths (JSON) and broadcast them via WebSocket/Threads API for real-time collaboration. Tooling (color, brush size) updates are local UI state that alter subsequent path metadata. For persistence we store serialized paths in `File` records and export PNG/SVG server-side if needed.

Q: How do you handle performance on large canvases or many simultaneous strokes?

A: We throttle input events and batch path updates for network sync. On the UI we render in requestAnimationFrame and use simplified path representations at lower zoom levels. For collaboration, we send deltas rather than full canvases and periodically snapshot for persistence.

### C) Fault-tolerant video processing pipeline (AWS SDK v3 + FFmpeg)

Q: You engineered a fault-tolerant video pipeline — describe the flow from upload to transcoded MP4.

A: Clients upload files via presigned S3 URLs (or via server for multipart ≤50MB). Once an upload completes, the server triggers a processing job: it downloads the file or streams from S3 into `fluent-ffmpeg` to transcode (e.g., .mov → .mp4), normalize codecs, and generate thumbnails. Processed artifacts are written back to S3 with stable keys. We implement retries on transient errors, log detailed job traces, and mark jobs in a DB jobs table to enable resume/retry.

Q: How do you handle multipart uploads and chunk limits (50MB)?

A: For files near/above the chunk threshold we prefer client-side multipart uploads with presigned part URLs to S3 to avoid buffering in the server. For server-initiated uploads, we validate size limits, stream to temporary storage with backpressure, and reject or advise clients to use multipart if needed.

### D) End-to-end automated captioning (Amazon Transcribe, FFmpeg)

Q: Explain the automated captioning pipeline and how you convert transcript JSON to SRT/VTT.

A: After upload, the server extracts audio via FFmpeg (e.g., convert video → audio WAV). We push the audio to Amazon Transcribe as an async job. We poll Transcribe for completion (or react to an SNS callback) and retrieve the JSON transcript. Conversion to SRT/VTT involves mapping transcript time ranges into caption blocks, merging short segments, rounding timestamps, and ensuring compliance with subtitle file format (sequence numbers, timestamps, and escaping). Generated subtitle files are stored in S3 and served via presigned URLs with CORS enabled for streaming playback.

Q: How do you ensure captions are in sync and resilient to long media files?

A: We use accurate FFmpeg extraction maintaining sample rate and container metadata. For long files, Transcribe supports multipart or chunked upload semantics; we break the audio into manageable segments and stitch the JSON results while preserving absolute start times. We also run a post-pass that compares video frame timestamps (if available) to the caption timestamps and apply small drift corrections.

### E) Fault tolerance, monitoring, and operational concerns

Q: How do you detect and recover from failed processing jobs?

A: Processing jobs are recorded in a jobs table with state (queued, running, failed, completed), timestamps, and retry counters. Workers pick jobs and update state atomically. On transient failures we implement exponential backoff retries; for persistent failures we flag the job for manual inspection and send alerts (logs/metrics). We also persist logs and FFmpeg output for debugging.

Q: What logging and metrics do you collect for the pipeline?

A: We log job lifecycle events, S3 object sizes/keys, FFmpeg stdout/stderr snippets, Transcribe job IDs and statuses, and error stacks. Metrics include job durations, success/failure rates, queue length, and per-file processing time percentiles. These feed into alerting and dashboards (e.g., CloudWatch/Prometheus).

---

### How to use these questions

Walk through the resume bullet, then use the targeted questions above; be ready to sketch the pipeline on a whiteboard. If you'd like, I can produce a one-page cheat sheet mapping each resume line to 3–4 succinct talking points.

