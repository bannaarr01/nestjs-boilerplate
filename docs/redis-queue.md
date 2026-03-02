# Redis and Queue Module

## Purpose
Queue and Redis support is optional and implemented via BullMQ.

## Enable
- `REDIS_ENABLED=true`
- Configure `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, optional auth keys

## Files
- `src/config/queue/queue-config.module.ts`
- `src/queue/queue.module.ts`
- `src/queue/queue.controller.ts`
- `src/queue/queue.service.ts`

## Endpoints
- `GET /api/v1/queue/health` (public)
- `GET /api/v1/queue/metrics`
- `GET /api/v1/queue/queues`
- `GET /api/v1/queue/queues/types`
- `GET /api/v1/queue/queues/:queueType/status`
- `GET /api/v1/queue/jobs/active`
- `GET /api/v1/queue/jobs/failed`
- `POST /api/v1/queue/jobs/demo`
- `GET /api/v1/queue/jobs/:jobId`

## Throttle Example
`POST /api/v1/queue/jobs/demo`:
- `@Throttle({ default: { limit: 5, ttl: 60000 } })`
- Means 5 requests per 1 minute per client.

## Multi-Instance Recommendation
Use Redis-backed throttle:
- `THROTTLE_USE_REDIS=true`
- `REDIS_ENABLED=true`

## Note
No generic Redis key-value controller is exposed.  
This template uses queue-first Redis integration.
