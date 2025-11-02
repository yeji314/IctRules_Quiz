/**
 * 사내 메신저 API 연동 서비스
 *
 * 현재는 Mock 구현
 * 추후 실제 사내 메신저 API로 교체 예정
 */

const db = require('../models');

class MessengerService {
  /**
   * 사용자 인증 및 정보 조회
   * @param {string} employeeId - 행원번호
   * @param {string} password - 비밀번호
   * @returns {Promise<Object>} 사용자 정보
   */
  async authenticateUser(employeeId, password) {
    // TODO: 실제 사내 메신저 API 연동
    // const response = await fetch(`${MESSENGER_API_URL}/auth`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${MESSENGER_API_KEY}` },
    //   body: JSON.stringify({ employeeId, password })
    // });

    // Mock 구현: DB에서 사용자 조회
    const user = await db.User.findOne({
      where: { employee_id: employeeId }
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 비밀번호 검증
    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new Error('비밀번호가 일치하지 않습니다');
    }

    return {
      id: user.id,
      employee_id: user.employee_id,
      name: user.name,
      department: user.department,
      email: user.email,
      role: user.role
    };
  }

  /**
   * 사용자 동기화
   * 사내 메신저에서 사용자 정보를 가져와 DB에 동기화
   */
  async syncUsers() {
    // TODO: 실제 사내 메신저 API 연동
    // const response = await fetch(`${MESSENGER_API_URL}/users`, {
    //   headers: { 'Authorization': `Bearer ${MESSENGER_API_KEY}` }
    // });
    // const users = await response.json();

    // for (const userData of users) {
    //   await db.User.upsert({
    //     employee_id: userData.employeeId,
    //     name: userData.name,
    //     department: userData.department,
    //     email: userData.email
    //   });
    // }

    console.log('사용자 동기화는 사내 메신저 API 연동 후 구현됩니다');
    return { success: true, message: 'Mock: 사용자 동기화 대기 중' };
  }

  /**
   * 사용자 정보 조회
   * @param {string} employeeId - 행원번호
   */
  async getUserInfo(employeeId) {
    // TODO: 실제 사내 메신저 API 연동

    // Mock 구현: DB에서 조회
    const user = await db.User.findOne({
      where: { employee_id: employeeId }
    });

    if (!user) {
      return null;
    }

    return {
      employee_id: user.employee_id,
      name: user.name,
      department: user.department,
      email: user.email
    };
  }
}

module.exports = new MessengerService();
