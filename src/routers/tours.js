const { Router } = require("express");
const toursController = require("../controllers/tours");
const { getToursByGuideIdValidator, getTourDetailValidator } = require("../validators/tours");
const { authMiddleware } = require("../middlewares/auth");

const router = Router();

/**
 * GET /tours/:id/detail
 * Tour completo con places populadas (foto, nombre, tipo, calificación),
 * available_schedules como array y datos del guía.
 */
router.get("/:id/detail", authMiddleware(), getTourDetailValidator, toursController.getTourDetail);

/**
 * GET /tours/:guideId
 * Todos los tours activos del guía con sus places y negocios aliados.
 */
router.get("/:guideId", authMiddleware(), getToursByGuideIdValidator, toursController.getToursByGuideId);


module.exports = router;