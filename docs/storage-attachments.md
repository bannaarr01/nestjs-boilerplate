# Storage and Attachments

## Storage Providers
- `local`
- `s3`

Files:
- `src/storage/storage.module.ts`
- `src/storage/storage.service.ts`
- `src/storage/drivers/local-storage.driver.ts`
- `src/storage/drivers/s3-storage.driver.ts`

## Attachment Module
Files:
- `src/attachment/attachment.controller.ts`
- `src/attachment/attachment.service.ts`
- `src/attachment/entities/attachment.entity.ts`

Endpoints:
- `POST /api/v1/attachments`
- `GET /api/v1/attachments/entity/:entityType/:entityId`
- `GET /api/v1/attachments/:id`
- `DELETE /api/v1/attachments/:id`

## Local Signed File Access
- Route: `GET /api/v1/attachments/files/*` (public but signed)
- Requires:
  - `expires` query
  - `sig` query
- Signature uses HMAC SHA-256 and `ATTACHMENT_URL_SIGNING_SECRET`.

## Upload Constraints
- `ATTACHMENT_MAX_FILE_SIZE_BYTES`
- `ATTACHMENT_ALLOWED_MIME_TYPES`
- `ATTACHMENT_UPLOAD_STORAGE=memory|disk`
- `ATTACHMENT_UPLOAD_TEMP_DIR` (disk mode)

## Security Notes
- MIME type allow-list + file signature/content checks are enforced.
- Local storage keys are sanitized and resolved safely under storage root.
- Keep `ATTACHMENT_URL_SIGNING_SECRET` strong in production.

## APP_BASE_URL Requirement
For local provider signed URLs, set:
- `APP_BASE_URL=http://<host>:<port>`
