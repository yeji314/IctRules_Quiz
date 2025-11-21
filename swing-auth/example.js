/**
 * Swing 인증 모듈 사용 예제
 *
 * 이 파일은 Swing 인증 모듈의 사용 방법을 보여주는 예제입니다.
 */

const { doSwingAuthenticate } = require('./index');

/**
 * 예제 1: SSO 토큰 인증
 */
async function example1_SSOAuth() {
  console.log('\n========== 예제 1: SSO 토큰 인증 ==========\n');

  try {
    const user = await doSwingAuthenticate({
      type: 'sso',
      ssoToken: 'sample_sso_token_abc123'
    });

    console.log('✅ 인증 성공!');
    console.log('사용자 정보:', user);
    console.log('이름:', user.employeeName);
    console.log('사번:', user.employeeNo);
    console.log('부서:', user.departmentName);
    console.log('이메일:', user.companyEmail);

    return user;
  } catch (error) {
    console.error('❌ 인증 실패:', error.message);
    throw error;
  }
}

/**
 * 예제 2: ID/Password 인증
 */
async function example2_IdPasswordAuth() {
  console.log('\n========== 예제 2: ID/Password 인증 ==========\n');

  try {
    const user = await doSwingAuthenticate({
      type: 'idpw',
      employeeNo: '19200617',
      password: 'mypassword123'
    });

    console.log('✅ 인증 성공!');
    console.log('사용자 정보:', user);
    console.log('이름:', user.employeeName);
    console.log('사번:', user.employeeNo);
    console.log('부서:', user.departmentName);
    console.log('직책:', user.employeePositionName);

    return user;
  } catch (error) {
    console.error('❌ 인증 실패:', error.message);
    throw error;
  }
}

/**
 * 예제 3: Express.js 미들웨어로 사용
 */
function example3_ExpressMiddleware() {
  console.log('\n========== 예제 3: Express.js 미들웨어 ==========\n');

  const express = require('express');
  const session = require('express-session');

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 세션 설정
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // HTTPS 환경에서는 true로 설정
  }));

  // SSO 로그인 라우트
  app.get('/auth/sso', async (req, res) => {
    try {
      const ssoToken = req.query.gw_sso_auth_code;

      if (!ssoToken) {
        return res.status(400).json({
          success: false,
          error: 'SSO 토큰이 필요합니다'
        });
      }

      const user = await doSwingAuthenticate({
        type: 'sso',
        ssoToken
      });

      // 세션에 사용자 정보 저장
      req.session.user = user;

      res.json({
        success: true,
        message: '로그인 성공',
        user: {
          name: user.employeeName,
          employeeNo: user.employeeNo,
          department: user.departmentName
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  });

  // ID/Password 로그인 라우트
  app.post('/auth/login', async (req, res) => {
    try {
      const { employeeNo, password } = req.body;

      if (!employeeNo || !password) {
        return res.status(400).json({
          success: false,
          error: '사번과 비밀번호가 필요합니다'
        });
      }

      const user = await doSwingAuthenticate({
        type: 'idpw',
        employeeNo,
        password
      });

      // 세션에 사용자 정보 저장
      req.session.user = user;

      res.json({
        success: true,
        message: '로그인 성공',
        user: {
          name: user.employeeName,
          employeeNo: user.employeeNo,
          department: user.departmentName
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  });

  // 로그아웃 라우트
  app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: '로그아웃 실패'
        });
      }
      res.json({
        success: true,
        message: '로그아웃 성공'
      });
    });
  });

  // 인증 확인 미들웨어
  const requireAuth = (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다'
      });
    }
    next();
  };

  // 보호된 라우트 예제
  app.get('/api/profile', requireAuth, (req, res) => {
    res.json({
      success: true,
      user: req.session.user
    });
  });

  console.log('Express.js 앱 설정 완료');
  console.log('다음 라우트가 추가되었습니다:');
  console.log('  GET  /auth/sso          - SSO 로그인');
  console.log('  POST /auth/login        - ID/PW 로그인');
  console.log('  POST /auth/logout       - 로그아웃');
  console.log('  GET  /api/profile       - 프로필 조회 (인증 필요)');

  return app;
}

/**
 * 예제 4: 환경별 설정 테스트
 */
async function example4_EnvironmentTest() {
  console.log('\n========== 예제 4: 환경별 설정 테스트 ==========\n');

  const { getCurrentEnvironment, getConfig } = require('./env');

  console.log('현재 환경:', getCurrentEnvironment());
  console.log('현재 설정:', getConfig());

  // Mock 환경에서 테스트
  console.log('\nMock 환경에서 인증 테스트...');
  try {
    const user = await doSwingAuthenticate({
      type: 'sso',
      ssoToken: 'mock_token'
    });
    console.log('✅ Mock 인증 성공:', user.employeeName);
  } catch (error) {
    console.error('❌ Mock 인증 실패:', error.message);
  }
}

/**
 * 예제 5: 에러 처리
 */
async function example5_ErrorHandling() {
  console.log('\n========== 예제 5: 에러 처리 ==========\n');

  // 잘못된 인증 타입
  try {
    await doSwingAuthenticate({
      type: 'invalid_type',
      ssoToken: 'token'
    });
  } catch (error) {
    console.log('예상된 에러 1:', error.message);
  }

  // SSO 토큰 누락
  try {
    await doSwingAuthenticate({
      type: 'sso'
      // ssoToken 누락
    });
  } catch (error) {
    console.log('예상된 에러 2:', error.message);
  }

  // 사번 또는 비밀번호 누락
  try {
    await doSwingAuthenticate({
      type: 'idpw',
      employeeNo: '12345678'
      // password 누락
    });
  } catch (error) {
    console.log('예상된 에러 3:', error.message);
  }
}

/**
 * 모든 예제 실행
 */
async function runAllExamples() {
  console.log('==================================================');
  console.log('Swing 인증 모듈 사용 예제');
  console.log('==================================================');

  try {
    // 환경 테스트
    await example4_EnvironmentTest();

    // SSO 인증 테스트 (Mock 환경)
    await example1_SSOAuth();

    // ID/Password 인증 테스트 (Mock 환경)
    await example2_IdPasswordAuth();

    // 에러 처리 테스트
    await example5_ErrorHandling();

    // Express.js 예제는 실행하지 않고 설정만 출력
    example3_ExpressMiddleware();

    console.log('\n==================================================');
    console.log('모든 예제 실행 완료!');
    console.log('==================================================\n');
  } catch (error) {
    console.error('\n예제 실행 중 오류 발생:', error);
  }
}

// 이 파일을 직접 실행할 때만 예제 실행
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  example1_SSOAuth,
  example2_IdPasswordAuth,
  example3_ExpressMiddleware,
  example4_EnvironmentTest,
  example5_ErrorHandling
};
