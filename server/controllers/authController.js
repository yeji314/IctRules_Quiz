const { generateToken } = require('../utils/jwt');
const { doSwingAuthenticate } = require('../../swing-auth');
const db = require('../models');
const bcrypt = require('bcryptjs');

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

    // admin 계정은 로컬 DB 비밀번호로 검증 (Swing 우회)
    if (employee_id === 'admin') {
      const adminUser = await db.User.findOne({
        where: { employee_id: 'admin' }
      });

      if (!adminUser) {
        return res.status(401).json({
          error: '관리자 계정을 찾을 수 없습니다'
        });
      }

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, adminUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: '비밀번호가 일치하지 않습니다'
        });
      }

      // JWT 토큰 생성
      const token = generateToken({
        id: adminUser.id,
        employee_id: adminUser.employee_id,
        role: adminUser.role
      });

      // 응답
      return res.json({
        success: true,
        token,
        user: {
          id: adminUser.id,
          employee_id: adminUser.employee_id,
          name: adminUser.name,
          department: adminUser.department,
          email: adminUser.email,
          role: adminUser.role
        },
        login_method: 'local'
      });
    }

    // 일반 사용자는 Swing 인증
    const swingUser = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo: employee_id,
      password: password
    });

    // 로컬 DB에서 사용자 조회 또는 생성
    let user = await db.User.findOne({
      where: { employee_id: swingUser.employeeNo }
    });

    if (!user) {
      // 사용자 자동 생성
      user = await db.User.create({
        employee_id: swingUser.employeeNo,
        password: `swing_sso_${Date.now()}`, // 임시 비밀번호
        name: swingUser.employeeName || swingUser.employeeNo,
        department: swingUser.departmentName || swingUser.deptName || '',
        email: swingUser.companyEmail || swingUser.emailAddress || '',
        role: 'user',
        login_method: 'swing_sso'
      });
    } else {
      // 기존 사용자의 정보 업데이트 (Swing에서 최신 정보 반영)
      await user.update({
        name: swingUser.employeeName || user.name,
        department: swingUser.departmentName || swingUser.deptName || user.department,
        email: swingUser.companyEmail || swingUser.emailAddress || user.email
      });
    }

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      employee_id: user.employee_id,
      role: user.role
    });

    // 응답
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        department: user.department,
        email: user.email,
        role: user.role
      },
      login_method: 'swing_sso'
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

    // Swing 인증
    const swingUser = await doSwingAuthenticate({
      type: 'sso',
      ssoToken: sso_token
    });

    // 로컬 DB에서 사용자 조회 또는 생성
    let user = await db.User.findOne({
      where: { employee_id: swingUser.employeeNo }
    });

    if (!user) {
      // 사용자 자동 생성
      user = await db.User.create({
        employee_id: swingUser.employeeNo,
        password: `swing_sso_${Date.now()}`, // 임시 비밀번호
        name: swingUser.employeeName || swingUser.employeeNo,
        department: swingUser.departmentName || swingUser.deptName || '',
        email: swingUser.companyEmail || swingUser.emailAddress || '',
        role: 'user',
        login_method: 'swing_sso'
      });
    } else {
      // 기존 사용자의 정보 업데이트 (Swing에서 최신 정보 반영)
      await user.update({
        name: swingUser.employeeName || user.name,
        department: swingUser.departmentName || swingUser.deptName || user.department,
        email: swingUser.companyEmail || swingUser.emailAddress || user.email
      });
    }

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      employee_id: user.employee_id,
      role: user.role
    });

    // 응답
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        department: user.department,
        email: user.email,
        role: user.role
      },
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

    // Swing 인증
    const swingUser = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo: employee_id,
      password: password
    });

    // 로컬 DB에서 사용자 조회 또는 생성
    let user = await db.User.findOne({
      where: { employee_id: swingUser.employeeNo }
    });

    if (!user) {
      // 사용자 자동 생성
      user = await db.User.create({
        employee_id: swingUser.employeeNo,
        password: `swing_sso_${Date.now()}`, // 임시 비밀번호
        name: swingUser.employeeName || swingUser.employeeNo,
        department: swingUser.departmentName || swingUser.deptName || '',
        email: swingUser.companyEmail || swingUser.emailAddress || '',
        role: 'user',
        login_method: 'swing_sso'
      });
    } else {
      // 기존 사용자의 정보 업데이트 (Swing에서 최신 정보 반영)
      await user.update({
        name: swingUser.employeeName || user.name,
        department: swingUser.departmentName || swingUser.deptName || user.department,
        email: swingUser.companyEmail || swingUser.emailAddress || user.email
      });
    }

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      employee_id: user.employee_id,
      role: user.role
    });

    // 응답
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        department: user.department,
        email: user.email,
        role: user.role
      },
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
