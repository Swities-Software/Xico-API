const { body, param } = require("express-validator");

const createBookingValidator = [
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

  body("notes")
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage("notes máximo 500 caracteres"),
];

const bookingIdValidator = [
  param("id")
    .notEmpty().withMessage("id es requerido")
    .isUUID(4).withMessage("id debe ser un UUID v4 válido"),
];

module.exports = { createBookingValidator, bookingIdValidator };