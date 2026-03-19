const { param , body} = require("express-validator");

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

const createTourValidator = [
  body("name")
    .notEmpty().withMessage("name es requerido")
    .isLength({ max: 150 }).withMessage("name máximo 150 caracteres"),

  body("description")
    .notEmpty().withMessage("description es requerida"),

  body("duration_min")
    .notEmpty().withMessage("duration_min es requerido")
    .isInt({ min: 1 }).withMessage("duration_min debe ser un entero mayor a 0"),

  body("price")
    .notEmpty().withMessage("price es requerido")
    .isFloat({ min: 0 }).withMessage("price debe ser un número positivo"),

  body("start_point")
    .notEmpty().withMessage("start_point es requerido"),

  body("start_lat")
    .notEmpty().withMessage("start_lat es requerido")
    .isFloat({ min: -90, max: 90 }).withMessage("start_lat debe ser entre -90 y 90"),

  body("start_lng")
    .notEmpty().withMessage("start_lng es requerido")
    .isFloat({ min: -180, max: 180 }).withMessage("start_lng debe ser entre -180 y 180"),

  body("available_schedules")
    .notEmpty().withMessage("available_schedules es requerido")
    .isArray({ min: 1 }).withMessage("available_schedules debe ser un array con al menos 1 horario"),

  body("place_ids")
    .optional()
    .isArray().withMessage("place_ids debe ser un array de UUIDs"),
];

const updateTourValidator = [
  param("id")
    .notEmpty().withMessage("id es requerido")
    .matches(UUID_REGEX).withMessage("id debe ser un UUID válido"),

  body("name")
    .optional()
    .isLength({ max: 150 }).withMessage("name máximo 150 caracteres"),

  body("duration_min")
    .optional()
    .isInt({ min: 1 }).withMessage("duration_min debe ser un entero mayor a 0"),

  body("price")
    .optional()
    .isFloat({ min: 0 }).withMessage("price debe ser un número positivo"),

  body("start_lat")
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage("start_lat debe ser entre -90 y 90"),

  body("start_lng")
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage("start_lng debe ser entre -180 y 180"),

  body("available_schedules")
    .optional()
    .isArray({ min: 1 }).withMessage("available_schedules debe ser un array con al menos 1 horario"),

  body("place_ids")
    .optional()
    .isArray().withMessage("place_ids debe ser un array de UUIDs"),
];

module.exports = {
  getToursByGuideIdValidator,
  getTourDetailValidator,
  createTourValidator,
  updateTourValidator,
};