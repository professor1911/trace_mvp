# Rice Trace Backend

## What changed in this version
- Consumer data is now three structured sections per batch: `farmer_profile`,
  `farm_plots` (array — supports multiple plots per farmer), and
  `full_disclosure` (everything else, as generic labeled blocks so new
  spreadsheet columns show up automatically without a schema change).
- Age, gender, mobile number, and banking fields do not exist anywhere in this
  schema — they're excluded at the data-model level, not filtered at query time.
- New endpoint to upload a KML shapefile for a specific plot, converting it to
  GeoJSON and attaching it so the frontend map can draw the real boundary.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env`, fill in `MONGO_URI`, `FRONTEND_URL`, `ADMIN_API_KEY`
3. `npm run seed` — imports the 39 pilot batches (from `portal_view.json`) and
   generates their QR codes into `qr_output/`
4. `npm start`

## Endpoints
- `GET /api/batches/:batchId/consumer` — public, no auth. What the QR/scanner/
  portal page calls. Returns `{ batch_id, product_name, farmer_profile,
  farm_plots, full_disclosure, ... }`.
- `GET /api/batches/:batchId/full` — internal, `x-admin-key` header required.
- `POST /api/batches` — internal. Creates a batch and auto-generates its QR.
- `POST /api/batches/:batchId/plots/:plotId/boundary` — internal, multipart
  form upload, field name `kml`. Converts the uploaded KML to GeoJSON and
  attaches it to that plot so the map shows the real field boundary instead
  of just a GPS pin.
- `PATCH /api/batches/:batchId/revoke` — internal. Deactivates a batch.

## Example: uploading a plot boundary
```bash
curl -X POST https://your-backend.onrender.com/api/batches/BATCH-2026-001/plots/92/boundary \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -F "kml=@/path/to/plot92.kml"
```

## Example: creating a new batch (auto-generates its QR)
```bash
curl -X POST https://your-backend.onrender.com/api/batches \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -d '{
    "batch_id": "BATCH-2026-040",
    "product_name": "Organic Rice 5kg",
    "pack_size": "5kg",
    "farmer_profile": {
      "name": "...", "village": "...", "district": "...", "state": "...",
      "ics_group": "...", "certifications": ["NPOP Organic"], "experience_years": 12,
      "story": "...", "training_attended": "..."
    },
    "farm_plots": [{ "plot_id": "PLOT-001", "area_acres": 4, "soil_type": "Loamy" }]
  }'
```

## Deploying
Netlify only hosts static files — deploy this backend separately on Render,
Railway, or Fly.io. Point `FRONTEND_URL` at your Netlify URL, and point the
frontend's `config.js` at wherever this backend ends up.
