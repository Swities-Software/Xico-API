const { validationResult } = require("express-validator");
const guidesService = require("../services/guides");
 
/**
 * GET /guides
 * Query params: lat, lng, radius, language, min_rating, max_rate, limit, offset
 */
async function getGuides(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
 
  const { lat, lng, radius, language, min_rating, max_rate, limit, offset } = req.query;
 
  try {
    const guides = await guidesService.getGuides({
      lat, lng, radius, language, min_rating, max_rate, limit, offset,
    });
 
    return res.status(200).json({
      data: guides,
      meta: {
        count:  guides.length,
        limit:  limit  ?? 20,
        offset: offset ?? 0,
      },
    });
  } catch (error) {
    console.error("[getGuides]", error.message);
    return res.status(500).json({ error: "Error interno al buscar guías" });
  }
}
 
/**
 * GET /guides/:id
 * Retorna perfil completo del guía con sus tours activos y places.
 */
async function getGuideById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
 
  try {
    const guide = await guidesService.getGuideById(req.params.id);
 
    if (!guide) {
      return res.status(404).json({ error: "Guía no encontrado" });
    }
 
    return res.status(200).json({ data: guide });
  } catch (error) {
    console.error("[getGuideById]", error.message);
    return res.status(500).json({ error: "Error interno al obtener el guía" });
  }
}

/**
 * PUT /guides/profile
 * Actualiza el perfil del guía autenticado.
 */
async function updateGuideProfile(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const guide_id = req.query.guide_id;
    const { bio, languages, hourly_rate, certification, available, photo_url } = req.body ?? {};

    const guide = await guidesService.updateGuideProfile(guide_id, {
      bio, languages, hourly_rate, certification, available, photo_url
    });

    return res.status(200).json({ data: guide });
  } catch (error) {
    console.error("[updateGuideProfile]", error.message);
    return res.status(error.status ?? 500).json({ error: error.message });
  }
}

module.exports = { getGuides, getGuideById, updateGuideProfile };