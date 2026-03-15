const { Router } = require("express");
const guidesController = require("../controllers/guides");
const { getGuidesValidator, getGuideByIdValidator } = require("../validators/guides");
const { authMiddleware } = require("../middlewares/auth");

const router = Router();

/**
 * GET /guides
 * Lista guías cercanos con filtros opcionales y paginación.
 */
router.get('/', /**authMiddleware()*/ getGuidesValidator, guidesController.getGuides);

/**
 * GET /guides/:id
 * Perfil completo del guía + sus tours activos con places.
 */
router.get('/:id', /**authMiddleware()*/ getGuideByIdValidator, guidesController.getGuideById);

module.exports = router;