const { validationResult } = require("express-validator");
const itineraryService = require("../services/itinerary");

/**
 * POST /itinerary/add
 * Agrega un place al itinerario del turista autenticado.
 */
async function addToItinerary(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const tourist_id = req.query.tourist_id; // TODO: req.user.tourist_id
    const { place_id } = req.body;
    const item = await itineraryService.addToItinerary({ tourist_id, place_id });
    return res.status(201).json({ data: item });
  } catch (error) {
    console.error("[addToItinerary]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

/**
 * DELETE /itinerary/:placeId
 * Quita un place del itinerario del turista autenticado.
 */
async function removeFromItinerary(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const tourist_id = req.query.tourist_id; // TODO: req.user.tourist_id
    const result = await itineraryService.removeFromItinerary({ tourist_id, place_id: req.params.placeId });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[removeFromItinerary]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

/**
 * GET /itinerary
 * Retorna la lista completa de lugares del itinerario del turista
 * con datos del place y negocio aliado si existe.
 */
async function getItinerary(req, res) {
  try {
    const tourist_id = req.query.tourist_id; // TODO: req.user.tourist_id
    const items = await itineraryService.getItinerary(tourist_id);
    return res.status(200).json({ data: items, meta: { count: items.length } });
  } catch (error) {
    console.error("[getItinerary]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

/**
 * POST /itinerary/assign-guide
 * Asocia un guía al itinerario y crea un booking con el tour seleccionado.
 */
async function assignGuide(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const tourist_id = req.query.tourist_id; // TODO: req.user.tourist_id
    const { guide_id, tour_id, date, time_slot } = req.body;
    const result = await itineraryService.assignGuide({ tourist_id, guide_id, tour_id, date, time_slot });
    return res.status(201).json(result);
  } catch (error) {
    console.error("[assignGuide]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

module.exports = { addToItinerary, removeFromItinerary, getItinerary, assignGuide };