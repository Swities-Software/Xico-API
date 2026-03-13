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

module.exports = { getToursByGuideId, getTourDetail };