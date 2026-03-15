const { Router } = require("express");
const businessesController = require("../controllers/businesses");
const { getBusinessesValidator, getBusinessByIdValidator } = require("../validators/businesses");
const { authMiddleware } = require("../middlewares/auth");
 
const router = Router();
 
/**
 * GET /businesses
 * Lista negocios cercanos con filtros opcionales y paginación.
 */
router.get("/", /**authMiddleware()*/ getBusinessesValidator,businessesController.getBusinesses);
 
/**
 * GET /businesses/:id
 * Negocio completo con place (horarios, fotos, dirección, teléfono) y guías que lo visitan.
 */
router.get("/:id",/**authMiddleware()*/ getBusinessByIdValidator, businessesController.getBusinessById);
 
module.exports = router;