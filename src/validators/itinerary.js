const { body, param } = require("express-validator");

// POST /itinerary/add
const addToItineraryValidator = [
  body("place_id")
    .notEmpty().withMessage("place_id es requerido")
    .isUUID(4).withMessage("place_id debe ser un UUID v4 válido"),
];

// DELETE /itinerary/:placeId
const removeFromItineraryValidator = [
  param("placeId")
    .notEmpty().withMessage("placeId es requerido")
    .isUUID(4).withMessage("placeId debe ser un UUID v4 válido"),
];

// POST /itinerary/assign-guide
const assignGuideValidator = [
  body("guide_id")
    .notEmpty().withMessage("guide_id es requerido")
    .isUUID(4).withMessage("guide_id debe ser un UUID v4 válido"),

  body("tour_id")
    .notEmpty().withMessage("tour_id es requerido")
    .isUUID(4).withMessage("tour_id debe ser un UUID v4 válido"),

  body("date")
    .notEmpty().withMessage("date es requerido")
    .isDate({ format: "YYYY-MM-DD" }).withMessage("date debe tener formato YYYY-MM-DD")
    .custom((value) => {
      if (new Date(value) < new Date()) throw new Error("date no puede ser en el pasado");
      return true;
    }),

  body("time_slot")
    .notEmpty().withMessage("time_slot es requerido")
    .matches(/^\d{2}:\d{2}$/).withMessage("time_slot debe tener formato HH:MM (ej: 08:00)"),
];

module.exports = { addToItineraryValidator, removeFromItineraryValidator, assignGuideValidator };