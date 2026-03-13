const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
// Importe de rutas
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

// Rutas
app.use('/guides', guidesRouter);
app.use('/businesses', businessesRouter);
app.use('/tours', toursRoute);

module.exports = app;