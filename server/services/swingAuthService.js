const swingApiClient = require('./swingApiClient');
const db = require('../models');
const jwt = require('jsonwebtoken');
const { swingSsoConfig } = require('../config/swing-sso');

/**
 * Swing Auth Service
 * Handles Swing SSO authentication and user management
 */
class SwingAuthService {
  constructor() {
    this.config = swingSsoConfig;
  }

  /**
   * SSO 토큰으로 인증
   * @param {string} ssoToken - SSO 토큰
   * @returns {Promise<object>} - { user, token }
   */
  async authenticateWithSsoToken(ssoToken) {
    try {
      console.log('[SwingAuthService] SSO Token Authentication started');

      // 1. Swing API를 통해 사용자 정보 조회
      const swingUser = await swingApiClient.authenticateWithSsoToken(ssoToken);
      console.log('[SwingAuthService] Swing user retrieved:', swingUser.employeeId);

      // 2. Access Control 검증
      await this.checkAccessControl(swingUser);

      // 3. 로컬 DB에서 사용자 조회 또는 생성
      const user = await this.findOrCreateUser(swingUser, 'swing_sso');

      // 4. 사용자 정보 동기화 (설정에 따라)
      if (this.config.userManagement.syncUserInfo) {
        await this.syncUserInfo(user, swingUser);
      }

      // 5. JWT 토큰 생성
      const token = this.generateToken(user);

      console.log('[SwingAuthService] SSO Authentication successful:', user.employee_id);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      console.error('[SwingAuthService] SSO Authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * ID/Password로 인증
   * @param {string} employeeId - 행원번호
   * @param {string} password - 비밀번호
   * @returns {Promise<object>} - { user, token }
   */
  async authenticateWithIdPassword(employeeId, password) {
    try {
      console.log('[SwingAuthService] ID/Password Authentication started:', employeeId);

      // 1. Swing API를 통해 사용자 정보 조회 및 인증
      const swingUser = await swingApiClient.authenticateWithIdPassword(employeeId, password);
      console.log('[SwingAuthService] Swing user authenticated:', swingUser.employeeId);

      // 2. Access Control 검증
      await this.checkAccessControl(swingUser);

      // 3. 로컬 DB에서 사용자 조회 또는 생성
      const user = await this.findOrCreateUser(swingUser, 'swing_sso');

      // 4. 사용자 정보 동기화 (설정에 따라)
      if (this.config.userManagement.syncUserInfo) {
        await this.syncUserInfo(user, swingUser);
      }

      // 5. JWT 토큰 생성
      const token = this.generateToken(user);

      console.log('[SwingAuthService] ID/Password Authentication successful:', user.employee_id);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      console.error('[SwingAuthService] ID/Password Authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * 사용자 조회 또는 생성
   * @param {object} swingUser - Swing에서 가져온 사용자 정보
   * @param {string} loginMethod - 로그인 방법
   * @returns {Promise<object>} - User 모델 인스턴스
   */
  async findOrCreateUser(swingUser, loginMethod) {
    try {
      // 1. swing_user_id로 사용자 조회
      let user = await db.User.findOne({
        where: { swing_user_id: swingUser.userId }
      });

      if (user) {
        console.log('[SwingAuthService] Existing user found:', user.employee_id);
        return user;
      }

      // 2. employee_id로 사용자 조회 (기존 로컬 계정과 연결)
      user = await db.User.findOne({
        where: { employee_id: swingUser.employeeId }
      });

      if (user) {
        console.log('[SwingAuthService] Linking existing local user to Swing:', user.employee_id);
        // 기존 사용자에 swing_user_id 연결
        await user.update({
          swing_user_id: swingUser.userId,
          login_method: loginMethod
        });
        return user;
      }

      // 3. 사용자 자동 생성 (설정에 따라)
      if (this.config.userManagement.autoCreateUser) {
        console.log('[SwingAuthService] Creating new user:', swingUser.employeeId);
        user = await this.createUser(swingUser, loginMethod);
        return user;
      }

      // 자동 생성 비활성화 시 에러
      throw new Error('User not found and auto-create is disabled');
    } catch (error) {
      console.error('[SwingAuthService] Find or create user failed:', error.message);
      throw error;
    }
  }

  /**
   * 새 사용자 생성
   * @param {object} swingUser - Swing에서 가져온 사용자 정보
   * @param {string} loginMethod - 로그인 방법
   * @returns {Promise<object>} - User 모델 인스턴스
   */
  async createUser(swingUser, loginMethod) {
    try {
      // 임시 비밀번호 생성 (SSO 사용자는 비밀번호 사용 안 함)
      const tempPassword = `swing_sso_${Date.now()}`;

      const user = await db.User.create({
        employee_id: swingUser.employeeId,
        password: tempPassword,
        name: swingUser.name || swingUser.employeeId,
        department: swingUser.department,
        email: swingUser.email,
        role: 'user',
        swing_user_id: swingUser.userId,
        position: swingUser.position,
        is_active: swingUser.isActive,
        login_method: loginMethod
      });

      console.log('[SwingAuthService] User created:', user.employee_id);
      return user;
    } catch (error) {
      console.error('[SwingAuthService] Create user failed:', error.message);
      throw error;
    }
  }

  /**
   * 사용자 정보 동기화
   * @param {object} user - User 모델 인스턴스
   * @param {object} swingUser - Swing에서 가져온 사용자 정보
   */
  async syncUserInfo(user, swingUser) {
    try {
      const updates = {};

      if (swingUser.name && swingUser.name !== user.name) {
        updates.name = swingUser.name;
      }
      if (swingUser.department && swingUser.department !== user.department) {
        updates.department = swingUser.department;
      }
      if (swingUser.email && swingUser.email !== user.email) {
        updates.email = swingUser.email;
      }
      if (swingUser.position && swingUser.position !== user.position) {
        updates.position = swingUser.position;
      }
      if (swingUser.isActive !== undefined && swingUser.isActive !== user.is_active) {
        updates.is_active = swingUser.isActive;
      }

      if (Object.keys(updates).length > 0) {
        await user.update(updates);
        console.log('[SwingAuthService] User info synced:', user.employee_id, updates);
      }
    } catch (error) {
      console.error('[SwingAuthService] Sync user info failed:', error.message);
      // Non-critical error, just log it
    }
  }

  /**
   * Access Control 검증
   * @param {object} swingUser - Swing에서 가져온 사용자 정보
   * @throws {Error} - 접근 권한이 없는 경우
   */
  async checkAccessControl(swingUser) {
    const controlType = this.config.accessControl.type;

    if (controlType === 'none') {
      return; // 제한 없음
    }

    try {
      if (controlType === 'employee_list') {
        // 행원번호 목록으로 제한
        const settings = await db.SSOSettings.getSetting('employee_list', []);
        const allowedList = Array.isArray(settings) ? settings : [];

        if (!allowedList.includes(swingUser.employeeId)) {
          throw new Error('Access denied: Employee not in allowed list');
        }
      } else if (controlType === 'department_list') {
        // 부서 목록으로 제한
        const settings = await db.SSOSettings.getSetting('department_list', []);
        const allowedList = Array.isArray(settings) ? settings : [];

        if (!allowedList.includes(swingUser.department)) {
          throw new Error('Access denied: Department not in allowed list');
        }
      } else if (controlType === 'collection') {
        // 데이터베이스 컬렉션으로 제한 (추후 구현)
        console.warn('[SwingAuthService] Collection-based access control not implemented');
      }

      console.log('[SwingAuthService] Access control passed:', swingUser.employeeId);
    } catch (error) {
      console.error('[SwingAuthService] Access control failed:', error.message);
      throw error;
    }
  }

  /**
   * JWT 토큰 생성
   * @param {object} user - User 모델 인스턴스
   * @returns {string} - JWT 토큰
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      employee_id: user.employee_id,
      role: user.role
    };

    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * 사용자 정보에서 민감한 정보 제거
   * @param {object} user - User 모델 인스턴스
   * @returns {object} - 정제된 사용자 정보
   */
  sanitizeUser(user) {
    const userData = user.toJSON();
    delete userData.password;
    return userData;
  }

  /**
   * Swing SSO 활성화 여부 확인
   * @returns {boolean}
   */
  isEnabled() {
    return this.config.enabled;
  }
}

// Singleton instance
const swingAuthService = new SwingAuthService();

module.exports = swingAuthService;
