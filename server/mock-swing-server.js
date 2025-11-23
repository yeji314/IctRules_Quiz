/**
 * Mock Swing SSO Server
 *
 * 테스트용 Swing SSO API Mock 서버
 * 실제 Swing 서버와 동일한 응답 구조를 제공합니다.
 *
 * 실행 방법:
 * node mock-swing-server.js
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = 8055;

// Mock 사용자 데이터
const mockUsers = {
  'swing_user_001': {
    user_id: 'swing_user_001',
    employee_id: '12345678',  // 테스트용 사번
    name: '홍길동',
    department: 'IT개발팀',
    position: '차장',
    email: 'hong@shinhan.com',
    is_active: true,
    password_hash: crypto.createHash('sha256').update('password123').digest('hex')
  },
  'swing_user_002': {
    user_id: 'swing_user_002',
    employee_id: '87654321',  // 테스트용 사번
    name: '김철수',
    department: '영업팀',
    position: '과장',
    email: 'kim@shinhan.com',
    is_active: true,
    password_hash: crypto.createHash('sha256').update('test1234').digest('hex')
  },
  'swing_user_003': {
    user_id: 'swing_user_003',
    employee_id: '19200617',  // 관리자 사번
    name: '관리자',
    department: '경영지원팀',
    position: '부장',
    email: 'admin@shinhan.com',
    is_active: true,
    password_hash: crypto.createHash('sha256').update('admin123').digest('hex')
  }
};

// employee_id로 사용자 찾기
const findUserByEmployeeId = (employeeId) => {
  return Object.values(mockUsers).find(u => u.employee_id === employeeId);
};

// Mock SSO 토큰 저장소
const validTokens = {
  'test_token_valid_user': 'swing_user_001',    // 일반 사용자
  'test_token_other_user': 'swing_user_002',    // 다른 사용자
  'test_token_admin': 'swing_user_003',         // 관리자
  'mock_token_12345': 'swing_user_001',         // 호환성
  'mock_token_67890': 'swing_user_002',         // 호환성
  'test_token_abc': 'swing_user_003'            // 호환성
};

/**
 * Health Check
 */
app.get('/swing-mock-server/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mock Swing Server is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * OAuth Token Authentication
 * POST /swing-mock-server/cau/v1/oauth-code-simple
 * 
 * 페이로드 구조:
 * {
 *   common: { clientId, clientSecret },
 *   data: { code }
 * }
 */
app.post('/swing-mock-server/cau/v1/oauth-code-simple', (req, res) => {
  const { common, data } = req.body;
  
  const clientId = common?.clientId;
  const clientSecret = common?.clientSecret;
  const ssoToken = data?.code;

  console.log('[Mock Swing] OAuth Token Authentication:', { clientId, ssoToken });

  // Client 인증 확인
  if (!clientId || !clientSecret) {
    return res.status(401).json({
      errors: [{
        message: 'Invalid client credentials',
        extensions: { code: 'UNAUTHORIZED' }
      }]
    });
  }

  // Mock: 특정 client_id만 허용
  const validClients = ['mock_client_id', 'dev_client_id', 'prod_client_id', '5FACKST52XY6YDLM'];
  if (!validClients.includes(clientId)) {
    return res.status(401).json({
      errors: [{
        message: 'Client not found',
        extensions: { code: 'UNAUTHORIZED' }
      }]
    });
  }

  // OAuth 코드 검증
  const userId = validTokens[ssoToken];
  if (!userId) {
    return res.status(401).json({
      data: {
        authResult: 'FAIL',
        message: 'Invalid SSO token'
      }
    });
  }

  const user = mockUsers[userId];
  if (!user) {
    return res.status(404).json({
      data: {
        authResult: 'FAIL',
        message: 'User not found'
      }
    });
  }

  // 활성 사용자 확인
  if (!user.is_active) {
    return res.status(403).json({
      data: {
        authResult: 'FAIL',
        message: 'User is inactive'
      }
    });
  }

  // 성공 응답 (실제 Swing API 응답 구조에 맞춤)
  console.log('[Mock Swing] Authentication successful:', user.employee_id);
  res.json({
    data: {
      authResult: 'SUCCESS',
      companyCode: 'SH',
      companyEmail: user.email,
      departmentNo: '1000',
      departmentName: user.department,
      employeeName: user.name,
      employeeNo: user.employee_id,
      employeePositionName: user.position
    }
  });
});

/**
 * ID/Password Authentication
 * POST /swing-mock-server/cau/v1/idpw-authorize
 */
app.post('/swing-mock-server/cau/v1/idpw-authorize', (req, res) => {
  const { client_id, client_secret, employee_id, password } = req.body;

  console.log('[Mock Swing] ID/Password Authentication:', { client_id, employee_id });

  // Client 인증 확인
  if (!client_id || !client_secret) {
    return res.status(401).json({
      errors: [{
        message: 'Invalid client credentials',
        extensions: { code: 'UNAUTHORIZED' }
      }]
    });
  }

  // Mock: 특정 client_id만 허용
  const validClients = ['mock_client_id', 'dev_client_id', 'prod_client_id'];
  if (!validClients.includes(client_id)) {
    return res.status(401).json({
      errors: [{
        message: 'Client not found',
        extensions: { code: 'UNAUTHORIZED' }
      }]
    });
  }

  // 사용자 찾기
  const user = findUserByEmployeeId(employee_id);
  if (!user) {
    return res.status(404).json({
      errors: [{
        message: 'User not found',
        extensions: { code: 'NOT_FOUND' }
      }]
    });
  }

  // 비밀번호 검증 (SHA-256 해시 비교)
  if (password !== user.password_hash) {
    return res.status(401).json({
      errors: [{
        message: 'Invalid password',
        extensions: { code: 'INVALID_CREDENTIALS' }
      }]
    });
  }

  // 활성 사용자 확인
  if (!user.is_active) {
    return res.status(403).json({
      errors: [{
        message: 'User is inactive',
        extensions: { code: 'FORBIDDEN' }
      }]
    });
  }

  // 성공 응답
  console.log('[Mock Swing] Authentication successful:', user.employee_id);
  res.json({
    user_id: user.user_id,
    employee_id: user.employee_id,
    name: user.name,
    department: user.department,
    position: user.position,
    email: user.email,
    is_active: user.is_active
  });
});

/**
 * Mock 사용자 목록 조회 (테스트용)
 * GET /swing-mock-server/test/users
 */
app.get('/swing-mock-server/test/users', (req, res) => {
  const users = Object.values(mockUsers).map(u => ({
    employee_id: u.employee_id,
    name: u.name,
    department: u.department,
    position: u.position,
    email: u.email
  }));

  res.json({
    success: true,
    users,
    valid_tokens: Object.keys(validTokens),
    passwords: {
      swing001: 'password123',
      swing002: 'test1234',
      swing003: 'qwerty'
    }
  });
});

/**
 * Mock 토큰 생성 (테스트용)
 * POST /swing-mock-server/test/create-token
 */
app.post('/swing-mock-server/test/create-token', (req, res) => {
  const { employee_id } = req.body;

  const user = findUserByEmployeeId(employee_id);
  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  // 랜덤 토큰 생성
  const token = `test_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  validTokens[token] = user.user_id;

  res.json({
    success: true,
    token,
    user_id: user.user_id,
    employee_id: user.employee_id,
    expires_in: 3600
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({
    errors: [{
      message: 'Endpoint not found',
      extensions: { code: 'NOT_FOUND' }
    }]
  });
});

// 에러 처리
app.use((err, req, res, next) => {
  console.error('[Mock Swing] Error:', err);
  res.status(500).json({
    errors: [{
      message: 'Internal server error',
      extensions: { code: 'INTERNAL_ERROR' }
    }]
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('=================================================');
  console.log('🚀 Mock Swing SSO Server Started');
  console.log('=================================================');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/swing-mock-server/health`);
  console.log(`Test users: http://localhost:${PORT}/swing-mock-server/test/users`);
  console.log('');
  console.log('📋 Mock Users:');
  Object.values(mockUsers).forEach(u => {
    console.log(`   - ${u.employee_id} (${u.name}) - ${u.department}`);
  });
  console.log('');
  console.log('🔑 Valid Tokens:');
  Object.keys(validTokens).forEach(token => {
    console.log(`   - ${token}`);
  });
  console.log('=================================================');
});
