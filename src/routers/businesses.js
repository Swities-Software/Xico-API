const { Router } = require("express");
const businessesController = require("../controllers/businesses");
const { getBusinessesValidator, getBusinessByIdValidator, updateBusinessProfileValidator  } = require("../validators/businesses");
const { authMiddleware } = require("../middlewares/auth");
 
const router = Router();
 
/**
 * GET /businesses
 * Lista negocios cercanos con filtros opcionales y paginación.
 */
router.get("/", authMiddleware(), getBusinessesValidator, businessesController.getBusinesses);
 
/**
 * GET /businesses/:id
 * Negocio completo con place (horarios, fotos, dirección, teléfono) y guías que lo visitan.
 */
router.get("/:id", authMiddleware(), getBusinessByIdValidator, businessesController.getBusinessById);

/**
 * PUT /businesses/profile
 * Actualiza description, history, logo_url, photos[], price_range y active
 * del negocio autenticado. Solo el dueño puede editarlo.
 */
router.put("/profile", /**authMiddleware(),**/ updateBusinessProfileValidator, businessesController.updateBusinessProfile);
 
module.exports = router;