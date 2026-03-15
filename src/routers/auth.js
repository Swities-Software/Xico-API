const { Router } = require('express');
const authController = require('../controllers/auth');
const { registerValidator, loginValidator } = require('../validators/auth');
const { authMiddleware } = require('../middlewares/auth');

const router = Router();

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', authMiddleware(), authController.me);

module.exports = router;
