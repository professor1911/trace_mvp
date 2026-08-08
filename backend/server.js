require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const traceRoutes = require('./routes/trace');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors()); // Netlify frontend is a different origin — this must stay open for the public GET route
app.use(express.json());

// Serve generated QR PNGs statically, e.g. GET /qr_output/QR-040-2026.png
app.use('/qr_output', express.static(path.join(__dirname, 'qr_output')));

app.use('/api/trace', traceRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rice_trace';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Rice Trace API listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
