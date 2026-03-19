const { Router } = require("express");
const { param } = require("express-validator");
const toursController = require("../controllers/tours");
const {
  getToursByGuideIdValidator,
  getTourDetailValidator,
  createTourValidator,
  updateTourValidator,
} = require("../validators/tours");
const { authMiddleware } = require("../middlewares/auth");

const router = Router();

/**
 * GET /tours/:id/detail
 * Tour completo con places populadas (foto, nombre, tipo, calificación),
 */
router.get("/:id/detail", authMiddleware(), getTourDetailValidator, toursController.getTourDetail);

/**
 * GET /tours/:guideId
 * Todos los tours activos del guía con sus places y negocios aliados.
 */
router.get("/:guideId", authMiddleware(), getToursByGuideIdValidator, toursController.getToursByGuideId);

/**
 * POST /tours
 * Crea un nuevo tour. Solo guías autenticados.
 */
router.post("/", createTourValidator, toursController.createTour);

/**
 * PUT /tours/:id
 * Actualiza un tour existente. Solo el guía dueño puede editarlo.
 */
router.put("/:id", updateTourValidator, toursController.updateTour);

/**
 * DELETE /tours/:id
 * Soft delete — cambia available = false. No elimina el tour de la BD
 */
router.delete("/:id", [
  param("id").notEmpty().isUUID(4).withMessage("id debe ser un UUID v4 válido")
], toursController.deleteTour);

module.exports = router;