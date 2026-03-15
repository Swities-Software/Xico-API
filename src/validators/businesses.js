const { query, param } = require("express-validator");
 
const getBusinessesValidator = [
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
 
  // type: categoría del place (vive en places.type según el ER)
  query("type")
    .optional()
    .isIn(["restaurante", "artesanías", "museos", "parques", "compras"])
    .withMessage("type debe ser: restaurante, artesanías, museos, parques o compras"),
 
  // subtype: solo aplica cuando type = restaurante (places.subtype)
  query("subtype")
    .optional()
    .isIn(["desayuno", "comida", "cena", "cafetería"])
    .withMessage("subtype debe ser: desayuno, comida, cena o cafetería"),
 
  // price_range: vive en businesses.price_range — CHECK(price_range BETWEEN 1 AND 4)
  query("price_range")
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage("price_range debe ser un entero entre 1 y 4")
    .toInt(),
 
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
 
const getBusinessByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("id es requerido")
    .isUUID()
    .withMessage("id debe ser un UUID válido"),
];
 
module.exports = { getBusinessesValidator, getBusinessByIdValidator };