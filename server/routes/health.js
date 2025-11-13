const express = require('express');
const router = express.Router();
const db = require('../models');

/**
 * 헬스체크 엔드포인트
 * Docker 컨테이너 상태 확인용
 */
router.get('/health', async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    await db.sequelize.authenticate();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;

