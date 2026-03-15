const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
// Importe de rutas
const authRouter = require('./routers/auth');
const guidesRouter = require('./routers/guides');
const businessesRouter = require('./routers/businesses');
const toursRoute = require('./routers/tours');

const app = express();

// Middlewares globales
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// prueba para ver la base de datos
app.get('/debug/tables', async (req, res) => {
  const supabase = require('./config/supabase');
  
  const tables = [
    'users', 'tourists', 'guides', 'businesses',
    'places', 'tours', 'tour_places', 'bookings',
    'itinerary_items', 'payments',
    'guide_reviews', 'place_reviews', 'tour_reviews'
  ];

  const results = {};

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(1);
    results[table] = error ? '❌ No existe' : '✅ Existe';
  }

  res.json(results);
});


// Rutas
app.use('/auth', authRouter);
app.use('/guides', guidesRouter);
app.use('/businesses', businessesRouter);
app.use('/tours', toursRoute);

module.exports = app;