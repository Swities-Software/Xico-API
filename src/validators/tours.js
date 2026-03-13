const { param } = require("express-validator");

// GET /tours/:guideId
const getToursByGuideIdValidator = [
  param("guideId")
    .notEmpty()
    .withMessage("guideId es requerido")
    .isUUID(4)
    .withMessage("guideId debe ser un UUID v4 válido"),
];

// GET /tours/:id/detail
const getTourDetailValidator = [
  param("id")
    .notEmpty()
    .withMessage("id es requerido")
    .isUUID(4)
    .withMessage("id debe ser un UUID v4 válido"),
];

module.exports = { getToursByGuideIdValidator, getTourDetailValidator };