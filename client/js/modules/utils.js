/**
 * 유틸리티 함수 모듈
 */

/**
 * 요소 선택 (querySelector 간소화)
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * 요소 선택 (querySelectorAll 간소화)
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * 요소 표시
 */
export function show(element) {
  if (element) {
    element.classList.remove('hidden');
  }
}

/**
 * 요소 숨김
 */
export function hide(element) {
  if (element) {
    element.classList.add('hidden');
  }
}

/**
 * 요소 토글
 */
export function toggle(element) {
  if (element) {
    element.classList.toggle('hidden');
  }
}

/**
 * 클래스 추가
 */
export function addClass(element, className) {
  if (element) {
    element.classList.add(className);
  }
}

/**
 * 클래스 제거
 */
export function removeClass(element, className) {
  if (element) {
    element.classList.remove(className);
  }
}

/**
 * 애니메이션 클래스 추가 후 제거
 */
export function animate(element, animationClass, duration = 500) {
  if (!element) return;

  addClass(element, animationClass);

  setTimeout(() => {
    removeClass(element, animationClass);
  }, duration);
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 시간 포맷팅 (HH:MM:SS)
 */
export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 숫자 포맷팅 (천단위 콤마)
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 배열 셔플
 */
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 지연 (Promise)
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 디바운스
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 스로틀
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 로컬 스토리지 저장
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('로컬 스토리지 저장 실패:', error);
    return false;
  }
}

/**
 * 로컬 스토리지 불러오기
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('로컬 스토리지 불러오기 실패:', error);
    return defaultValue;
  }
}

/**
 * 로컬 스토리지 삭제
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('로컬 스토리지 삭제 실패:', error);
    return false;
  }
}

/**
 * 사운드 재생 (비활성화됨)
 */
export function playSound(type) {
  // 효과음 비활성화
  return;
}

/**
 * 복사 방지
 */
export function preventCopy(element) {
  if (!element) return;

  element.addEventListener('copy', (e) => e.preventDefault());
  element.addEventListener('cut', (e) => e.preventDefault());
  element.addEventListener('paste', (e) => e.preventDefault());
  element.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * HTML 이스케이프
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
