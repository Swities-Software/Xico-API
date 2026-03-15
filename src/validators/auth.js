const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .notEmpty().withMessage('name es requerido')
    .isString().trim()
    .isLength({ min: 2, max: 100 }).withMessage('name debe tener entre 2 y 100 caracteres'),

  body('email')
    .notEmpty().withMessage('email es requerido')
    .isEmail().withMessage('email inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('password es requerido')
    .isLength({ min: 8 }).withMessage('password debe tener al menos 8 caracteres'),

  body('role')
    .optional()
    .isIn(['tourist', 'guide', 'business'])
    .withMessage('role debe ser: tourist, guide o business'),
];

const loginValidator = [
  body('email')
    .notEmpty().withMessage('email es requerido')
    .isEmail().withMessage('email inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('password es requerido'),
];

module.exports = { registerValidator, loginValidator };
