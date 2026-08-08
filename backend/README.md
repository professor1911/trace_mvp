# Rice Trace Backend

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `MONGO_URI` — MongoDB Atlas free tier connection string (or local MongoDB)
   - `FRONTEND_URL` — your deployed Netlify URL (QR codes will point here)
   - `ADMIN_API_KEY` — any long random string, protects write endpoints
3. `npm run seed` — imports the 39 existing pilot batches and generates their QR codes into `qr_output/`
4. `npm start` — runs the API on port 4000 (or `PORT` from `.env`)

## Endpoints
- `GET /api/batches/:batchId/consumer` — public, no auth. What the QR page calls.
- `GET /api/batches/:batchId/full` — internal, requires `x-admin-key` header.
- `POST /api/batches` — internal, requires `x-admin-key` header. Creates a batch
  **and automatically generates its QR code** — this is the "packaging → QR" step.
- `PATCH /api/batches/:batchId/revoke` — internal, requires `x-admin-key` header.
  Deactivates a batch; the public endpoint then 404s for it without deleting data.

## Deploying
Netlify only hosts static files — it cannot run this Express server. Deploy this
backend separately on Render, Railway, or Fly.io (all have free tiers suitable
for a pilot). Point `FRONTEND_URL` in `.env` at your Netlify URL, and point
`config.js` in the frontend at wherever this backend ends up.

## Example: creating a new batch (auto-generates its QR)
```bash
curl -X POST https://your-backend.onrender.com/api/batches \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -d '{
    "batch_id": "BATCH-2026-040",
    "product_name": "Organic Rice 5kg",
    "pack_size": "5kg",
    "farmer": { "name": "...", "village": "...", "district": "...", "state": "..." },
    "crop": { "crop": "Paddy", "variety": "MTU-1010", "season": "Kharif" }
  }'
```
The response includes `qr_code_url` and `qr_image_path` — the QR PNG is ready
immediately, no manual generation step.
