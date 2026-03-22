const { query, param, body} = require("express-validator")

const getGuidesValidator = [
  query("lat")
    .notEmpty()
    .withMessage("lat es requerido")
    .isFloat({ min: -90, max: 90 })
    .withMessage("lat debe ser un número entre -90 y 90")
    .toFloat(),
 
  query("lng")
    .notEmpty()
    .withMessage("lng es requerido")
    .isFloat({ min: -180, max: 180 })
    .withMessage("lng debe ser un número entre -180 y 180")
    .toFloat(),
 
  query("radius")
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage("radius debe ser un entero entre 100 y 50000 metros")
    .toInt(),
 
  query("language")
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage("language debe ser un código de idioma válido (ej: es, en, fr)"),
 
  query("min_rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("min_rating debe ser un número entre 0 y 5")
    .toFloat(),
 
  query("max_rate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("max_rate debe ser un número positivo")
    .toFloat(),
 
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit debe ser un entero entre 1 y 50")
    .toInt(),
 
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("offset debe ser un entero mayor o igual a 0")
    .toInt(),
];
 
const getGuideByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("id es requerido")
    .isUUID()
    .withMessage("id debe ser un UUID válido"),
];

const updateGuideProfileValidator = [
  body("bio")
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage("bio máximo 500 caracteres"),

  body("languages")
    .optional()
    .isArray({ min: 1 }).withMessage("languages debe ser un array con al menos 1 idioma"),

  body("hourly_rate")
    .optional()
    .isFloat({ min: 0 }).withMessage("hourly_rate debe ser un número positivo"),

  body("certification")
    .optional()
    .isURL().withMessage("certification debe ser una URL válida de Cloudinary"),

  body("photo_url")
    .optional()
    .isURL().withMessage("photo_url debe ser una URL válida de Cloudinary"),

  body("available")
    .optional()
    .isBoolean().withMessage("available debe ser true o false"),
];

module.exports = { getGuidesValidator, getGuideByIdValidator, updateGuideProfileValidator };