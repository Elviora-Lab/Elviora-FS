# Queues — BullMQ

Background workers for slow / out-of-band operations:

- **email** — transactional sends (welcome, order confirmation, shipping)
- **notifications** — push, WhatsApp, SMS
- **image-processing** — Sharp resize + webp/avif derivatives after S3 upload
- **analytics-aggregation** — daily roll-ups into reporting tables
- **ai-recommendations** — async product-match jobs

## Suggested layout

```
src/server/queues/
├── connection.ts        # ioredis connection factory (shared with cache)
├── queues.ts            # Queue + QueueEvents instances per name
├── jobs/
│   ├── email.job.ts     # JobData type + enqueue helper
│   ├── notifications.job.ts
│   ├── image-processing.job.ts
│   └── ai-recommendations.job.ts
└── worker.ts            # Worker entrypoint (run separately: `tsx src/server/queues/worker.ts`)
```

## Runtime model

- The Next.js app **enqueues** jobs (queues.ts).
- A separate Node process (`tsx src/server/queues/worker.ts`) **consumes** them.
- Both connect to the same Redis instance.

This split keeps the request path fast and stateless. Avoid running workers inside Next.js — App Router cold starts and route-level isolation make long-lived workers fragile.

## When you implement this

1. Reuse `getRedis()` from [src/server/cache/redis.ts](../cache/redis.ts) for the BullMQ connection factory.
2. Pair every job with a typed `enqueue<JobName>(payload)` helper so callers stay type-safe.
3. Treat workers as deployable artifacts — give them their own Dockerfile target.
