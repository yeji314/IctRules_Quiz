const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 모든 관리자 API는 인증 + 관리자 권한 필요
router.use(authenticate);
router.use(requireAdmin);

/**
 * ==========================================
 * 이벤트 관리
 * ==========================================
 */

/**
 * GET /api/admin/events
 * 이벤트 목록 조회
 */
router.get('/events', adminController.listEvents);

/**
 * POST /api/admin/events
 * 이벤트 생성
 */
router.post('/events', adminController.createEvent);

/**
 * PUT /api/admin/events/:id
 * 이벤트 수정
 */
router.put('/events/:id', adminController.updateEvent);

/**
 * DELETE /api/admin/events/:id
 * 이벤트 삭제
 */
router.delete('/events/:id', adminController.deleteEvent);

/**
 * ==========================================
 * 문제 관리
 * ==========================================
 */

/**
 * GET /api/admin/questions
 * 문제 목록 조회 (event_id 필수)
 */
router.get('/questions', adminController.listQuestions);

/**
 * POST /api/admin/questions
 * 문제 생성
 */
router.post('/questions', adminController.createQuestion);

/**
 * PUT /api/admin/questions/:id
 * 문제 수정
 */
router.put('/questions/:id', adminController.updateQuestion);

/**
 * DELETE /api/admin/questions/:id
 * 문제 삭제
 */
router.delete('/questions/:id', adminController.deleteQuestion);

/**
 * POST /api/admin/questions/bulk-upload
 * 문제 대량 업로드
 */
router.post('/questions/bulk-upload', adminController.bulkUploadQuestions);

/**
 * ==========================================
 * 통계
 * ==========================================
 */

/**
 * GET /api/admin/stats/overview
 * 전체 통계 조회
 */
router.get('/stats/overview', adminController.getOverview);

/**
 * GET /api/admin/stats/departments
 * 부서별 통계 조회 (event_id 옵션)
 */
router.get('/stats/departments', adminController.getDepartmentStats);

/**
 * GET /api/admin/stats/questions
 * 문제별 통계 조회 (event_id 필수)
 */
router.get('/stats/questions', adminController.getQuestionStats);

/**
 * GET /api/admin/stats/users
 * 사용자 목록 및 통계 조회 (event_id 옵션)
 */
router.get('/stats/users', adminController.getUserList);

/**
 * ==========================================
 * LuckyDraw 관리
 * ==========================================
 */

/**
 * POST /api/admin/luckydraw/draw
 * LuckyDraw 추첨
 */
router.post('/luckydraw/draw', adminController.drawWinners);

/**
 * GET /api/admin/luckydraw/winners
 * 당첨자 목록 조회 (event_id 옵션)
 */
router.get('/luckydraw/winners', adminController.getWinners);

/**
 * PUT /api/admin/luckydraw/:id/claim
 * 상품 수령 처리
 */
router.put('/luckydraw/:id/claim', adminController.claimPrize);

/**
 * ==========================================
 * SSO 설정 관리
 * ==========================================
 */

/**
 * GET /api/admin/sso/settings
 * SSO 설정 전체 조회
 */
router.get('/sso/settings', adminController.getSsoSettings);

/**
 * GET /api/admin/sso/settings/:key
 * 특정 SSO 설정 조회
 */
router.get('/sso/settings/:key', adminController.getSsoSetting);

/**
 * PUT /api/admin/sso/settings/:key
 * SSO 설정 업데이트
 */
router.put('/sso/settings/:key', adminController.updateSsoSetting);

/**
 * GET /api/admin/sso/status
 * SSO 시스템 상태 확인
 */
router.get('/sso/status', adminController.getSsoStatus);

/**
 * ==========================================
 * 부서별 인원 관리
 * ==========================================
 */

/**
 * GET /api/admin/departments
 * 부서별 인원 정보 조회
 */
router.get('/departments', adminController.getDepartments);

/**
 * POST /api/admin/departments
 * 부서 정보 생성
 */
router.post('/departments', adminController.createDepartment);

/**
 * PUT /api/admin/departments/:id
 * 부서 정보 수정
 */
router.put('/departments/:id', adminController.updateDepartment);

/**
 * DELETE /api/admin/departments/:id
 * 부서 정보 삭제
 */
router.delete('/departments/:id', adminController.deleteDepartment);

module.exports = router;
