const { generateToken } = require('../utils/jwt');
const messengerService = require('../services/messengerService');
const swingAuthService = require('../services/swingAuthService');
const db = require('../models');

/**
 * 로그인
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    // 입력 검증
    if (!employee_id || !password) {
      return res.status(400).json({
        error: '행원번호와 비밀번호를 입력해주세요'
      });
    }

    // 사내 메신저 API를 통한 인증 (현재는 Mock)
    const userInfo = await messengerService.authenticateUser(employee_id, password);

    // JWT 토큰 생성
    const token = generateToken({
      id: userInfo.id,
      employee_id: userInfo.employee_id,
      role: userInfo.role
    });

    // 응답
    res.json({
      success: true,
      token,
      user: {
        id: userInfo.id,
        employee_id: userInfo.employee_id,
        name: userInfo.name,
        department: userInfo.department,
        email: userInfo.email,
        role: userInfo.role
      }
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(401).json({
      error: error.message || '로그인에 실패했습니다'
    });
  }
};

/**
 * 로그아웃
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // 클라이언트에서 토큰 삭제하면 됨
    // 서버에서는 특별한 처리 불필요 (stateless JWT)

    res.json({
      success: true,
      message: '로그아웃되었습니다'
    });

  } catch (error) {
    console.error('로그아웃 에러:', error);
    res.status(500).json({
      error: '로그아웃에 실패했습니다'
    });
  }
};

/**
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    // authenticate 미들웨어에서 req.user 설정됨
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        error: '사용자를 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    res.status(500).json({
      error: '사용자 정보 조회에 실패했습니다'
    });
  }
};

/**
 * Swing SSO - 토큰 인증
 * POST /api/auth/swing/token
 */
const swingSsoTokenLogin = async (req, res) => {
  try {
    const { sso_token } = req.body;

    // 입력 검증
    if (!sso_token) {
      return res.status(400).json({
        error: 'SSO 토큰이 필요합니다'
      });
    }

    // SSO 활성화 여부 확인
    if (!swingAuthService.isEnabled()) {
      return res.status(403).json({
        error: 'Swing SSO가 비활성화되어 있습니다'
      });
    }

    // Swing SSO 인증
    const result = await swingAuthService.authenticateWithSsoToken(sso_token);

    // 응답
    res.json({
      success: true,
      token: result.token,
      user: result.user,
      login_method: 'swing_sso'
    });

  } catch (error) {
    console.error('Swing SSO 토큰 인증 에러:', error);
    res.status(401).json({
      error: error.message || 'SSO 인증에 실패했습니다'
    });
  }
};

/**
 * Swing SSO - ID/Password 인증
 * POST /api/auth/swing/idpw
 */
const swingIdPasswordLogin = async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    // 입력 검증
    if (!employee_id || !password) {
      return res.status(400).json({
        error: '행원번호와 비밀번호를 입력해주세요'
      });
    }

    // SSO 활성화 여부 확인
    if (!swingAuthService.isEnabled()) {
      return res.status(403).json({
        error: 'Swing SSO가 비활성화되어 있습니다'
      });
    }

    // Swing ID/Password 인증
    const result = await swingAuthService.authenticateWithIdPassword(employee_id, password);

    // 응답
    res.json({
      success: true,
      token: result.token,
      user: result.user,
      login_method: 'swing_sso'
    });

  } catch (error) {
    console.error('Swing ID/Password 인증 에러:', error);
    res.status(401).json({
      error: error.message || 'ID/Password 인증에 실패했습니다'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  swingSsoTokenLogin,
  swingIdPasswordLogin
};
