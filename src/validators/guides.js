const { query, param} = require("express-validator")

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
    .isUUID(4)
    .withMessage("id debe ser un UUID v4 válido"),
];
 
module.exports = { getGuidesValidator, getGuideByIdValidator };