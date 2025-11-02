const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 * 로그아웃
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/me
 * 현재 사용자 정보 조회 (인증 필요)
 */
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
