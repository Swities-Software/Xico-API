const { param } = require("express-validator");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /tours/:guideId
const getToursByGuideIdValidator = [
  param("guideId")
    .notEmpty()
    .withMessage("guideId es requerido")
    .matches(UUID_REGEX)
    .withMessage("guideId debe ser un UUID válido"),
];

// GET /tours/:id/detail
const getTourDetailValidator = [
  param("id")
    .notEmpty()
    .withMessage("id es requerido")
    .matches(UUID_REGEX)
    .withMessage("id debe ser un UUID válido"),
];

module.exports = { getToursByGuideIdValidator, getTourDetailValidator };