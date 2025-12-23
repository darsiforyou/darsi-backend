const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordController=require('../controllers/passwordController')

router.post('/', authController.handleLogin);

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', passwordController.forgotPasswordOtp);

// ==================== VERIFY OTP ====================
router.post('/verify-otp', passwordController.verifyOtp);

// ==================== RESET PASSWORD ====================
router.post('/reset-password', passwordController.resetPassword);

module.exports = router;
