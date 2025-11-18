const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate } = require('../middleware/auth');

// 모든 퀴즈 API는 인증 필요
router.use(authenticate);

/**
 * GET /api/quiz/list
 * 퀴즈 목록 조회
 */
router.get('/list', quizController.getQuizList);

/**
 * POST /api/quiz/start
 * 퀴즈 세션 시작
 */
router.post('/start', quizController.startQuizSession);

/**
 * POST /api/quiz/answer
 * 답변 제출
 */
router.post('/answer', quizController.submitAnswer);

/**
 * POST /api/quiz/complete
 * 세션 완료
 */
router.post('/complete', quizController.completeSession);

/**
 * GET /api/quiz/my-sessions
 * 내 세션 목록
 */
router.get('/my-sessions', quizController.getMySessions);

/**
 * POST /api/quiz/cancel
 * 세션 취소/중단
 */
router.post('/cancel', quizController.cancelSession);

module.exports = router;
