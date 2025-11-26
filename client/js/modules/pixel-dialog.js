/**
 * 픽셀 스타일 커스텀 다이얼로그
 * native alert/confirm을 대체하는 모달 시스템
 */

/**
 * 픽셀 Alert 다이얼로그 (확인 버튼 1개)
 * @param {string} message - 표시할 메시지
 * @param {Object} options - 옵션
 * @param {string} options.title - 다이얼로그 제목 (기본: "알림")
 * @param {Function} options.onClose - 닫힐 때 콜백
 */
export function showPixelAlert(message, { title = '알림', onClose } = {}) {
  return new Promise((resolve) => {
    // body 스크롤 방지
    document.body.style.overflow = 'hidden';

    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'pixel-dialog-overlay';

    // 다이얼로그 박스 생성
    const dialogBox = document.createElement('div');
    dialogBox.className = 'pixel-dialog-box';

    // 타이틀
    const titleEl = document.createElement('div');
    titleEl.className = 'pixel-dialog-title';
    titleEl.textContent = title;

    // 메시지
    const messageEl = document.createElement('div');
    messageEl.className = 'pixel-dialog-message';
    messageEl.textContent = message;

    // 버튼 영역
    const buttonsEl = document.createElement('div');
    buttonsEl.className = 'pixel-dialog-buttons single-button';

    // 확인 버튼
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'pixel-dialog-btn pixel-dialog-btn-confirm';
    confirmBtn.textContent = '확인';

    // 닫기 핸들러
    const closeDialog = () => {
      document.body.style.overflow = '';
      overlay.remove();
      if (onClose) onClose();
      resolve();
    };

    confirmBtn.addEventListener('click', closeDialog);

    // 조립
    buttonsEl.appendChild(confirmBtn);
    dialogBox.appendChild(titleEl);
    dialogBox.appendChild(messageEl);
    dialogBox.appendChild(buttonsEl);
    overlay.appendChild(dialogBox);
    document.body.appendChild(overlay);

    // 확인 버튼에 포커스
    setTimeout(() => confirmBtn.focus(), 100);

    // Enter 키로도 닫기 가능
    const handleKeydown = (e) => {
      if (e.key === 'Enter') {
        closeDialog();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  });
}

/**
 * 픽셀 Confirm 다이얼로그 (취소/확인 버튼 2개)
 * @param {string} message - 표시할 메시지
 * @param {Object} options - 옵션
 * @param {string} options.title - 다이얼로그 제목 (기본: "확인")
 * @returns {Promise<boolean>} - 확인 클릭 시 true, 취소 시 false
 */
export function showPixelConfirm(message, { title = '확인' } = {}) {
  return new Promise((resolve) => {
    // body 스크롤 방지
    document.body.style.overflow = 'hidden';

    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'pixel-dialog-overlay';

    // 다이얼로그 박스 생성
    const dialogBox = document.createElement('div');
    dialogBox.className = 'pixel-dialog-box';

    // 타이틀
    const titleEl = document.createElement('div');
    titleEl.className = 'pixel-dialog-title';
    titleEl.textContent = title;

    // 메시지
    const messageEl = document.createElement('div');
    messageEl.className = 'pixel-dialog-message';
    messageEl.textContent = message;

    // 버튼 영역
    const buttonsEl = document.createElement('div');
    buttonsEl.className = 'pixel-dialog-buttons';

    // 취소 버튼
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'pixel-dialog-btn pixel-dialog-btn-cancel';
    cancelBtn.textContent = '취소';

    // 확인 버튼
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'pixel-dialog-btn pixel-dialog-btn-confirm';
    confirmBtn.textContent = '확인';

    // 닫기 핸들러
    const closeDialog = (result) => {
      document.body.style.overflow = '';
      overlay.remove();
      document.removeEventListener('keydown', handleKeydown);
      resolve(result);
    };

    // 이벤트 핸들러
    cancelBtn.addEventListener('click', () => closeDialog(false));
    confirmBtn.addEventListener('click', () => closeDialog(true));

    // 오버레이 바깥 클릭 시 취소
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDialog(false);
      }
    });

    // 조립
    buttonsEl.appendChild(cancelBtn);
    buttonsEl.appendChild(confirmBtn);
    dialogBox.appendChild(titleEl);
    dialogBox.appendChild(messageEl);
    dialogBox.appendChild(buttonsEl);
    overlay.appendChild(dialogBox);
    document.body.appendChild(overlay);

    // 확인 버튼에 포커스
    setTimeout(() => confirmBtn.focus(), 100);

    // Enter/Esc 키 핸들링
    const handleKeydown = (e) => {
      if (e.key === 'Enter') {
        closeDialog(true);
      } else if (e.key === 'Escape') {
        closeDialog(false);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  });
}
