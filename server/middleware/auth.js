const { verifyToken } = require('../utils/jwt');
const db = require('../models');

/**
 * JWT 인증 미들웨어
 */
const authenticate = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: '인증 토큰이 필요합니다'
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰 검증
    const decoded = verifyToken(token);

    // 사용자 조회
    const user = await db.User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: '유효하지 않은 사용자입니다'
      });
    }

    // req에 사용자 정보 추가
    req.user = user;
    next();

  } catch (error) {
    console.error('인증 에러:', error);
    return res.status(401).json({
      error: '인증에 실패했습니다'
    });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: '인증이 필요합니다'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: '관리자 권한이 필요합니다'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
