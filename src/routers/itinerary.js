const { Router } = require("express");
const itineraryController = require("../controllers/itinerary");
const { addToItineraryValidator, removeFromItineraryValidator, assignGuideValidator } = require("../validators/itinerary");
// const { authMiddleware } = require("../middlewares/auth");

const router = Router();

/**
 * GET /itinerary
 * Retorna la lista completa de lugares guardados por el turista
 * con datos del place y negocio aliado si existe.
 */
router.get("/", itineraryController.getItinerary);

/**
 * POST /itinerary/add
 * Agrega un place al itinerario del turista autenticado.
 */
router.post("/add", addToItineraryValidator, itineraryController.addToItinerary);

/**
 * POST /itinerary/assign-guide
 * Asocia un guía al itinerario y crea un booking.
 */
router.post("/assign-guide", assignGuideValidator, itineraryController.assignGuide);

/**
 * DELETE /itinerary/:placeId
 * Quita un place del itinerario del turista autenticado.
 */
router.delete("/:placeId", removeFromItineraryValidator, itineraryController.removeFromItinerary);

module.exports = router;