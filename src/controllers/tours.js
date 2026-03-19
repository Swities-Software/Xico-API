const { validationResult } = require("express-validator");
const toursService = require("../services/tours");

/**
 * GET /tours/:guideId
 * Retorna todos los tours activos del guía con sus places y negocios aliados.
 */
async function getToursByGuideId(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const tours = await toursService.getToursByGuideId(req.params.guideId);

    return res.status(200).json({
      data: tours,
      meta: { count: tours.length },
    });
  } catch (error) {
    console.error("[getToursByGuideId]", error.message);
    return res.status(500).json({ error: "Error interno al obtener tours del guía" });
  }
}

/**
 * GET /tours/:id/detail
 * Retorna el tour completo con places populadas y datos del guía.
 */
async function getTourDetail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const tour = await toursService.getTourDetail(req.params.id);

    if (!tour) {
      return res.status(404).json({ error: "Tour no encontrado" });
    }

    return res.status(200).json({ data: tour });
  } catch (error) {
    console.error("[getTourDetail]", error.message);
    return res.status(500).json({ error: "Error interno al obtener el tour" });
  }
}

async function createTour(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const guide_id = req.query.guide_id;
    const { name, description, duration_min, price, start_point, start_lat, start_lng, available_schedules, place_ids } = req.body;

    const tour = await toursService.createTour({ guide_id, name, description, duration_min, price, start_point, start_lat, start_lng, available_schedules, place_ids });
    return res.status(201).json({ data: tour });
  } catch (error) {
    console.error("[createTour]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function updateTour(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const guide_id = req.query.guide_id;
    const tour = await toursService.updateTour(req.params.id, guide_id, req.body);
    return res.status(200).json({ data: tour });
  } catch (error) {
    console.error("[updateTour]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

async function deleteTour(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const guide_id = req.query.guide_id;
    const result = await toursService.deleteTour(req.params.id, guide_id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[deleteTour]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

module.exports = { getToursByGuideId, getTourDetail, createTour, updateTour, deleteTour };