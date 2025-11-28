/**
 * 말풍선 앵커 유틸리티
 *
 * 캐릭터-말풍선 고정 정렬 로직:
 * - 말풍선 꼬리 tip과 캐릭터 정중앙이 항상 정확히 일치
 * - 모든 해상도에서 일관된 정렬 보장
 */

// Gap 제약 상수 (불변 조건)
const IDEAL_GAP = 8;  // 목표 간격
const MIN_GAP = 4;    // 겹침 방지
const MAX_GAP = 14;   // 멀어짐 방지

// 말풍선 SVG에서 꼬리 끝점의 상대 위치
// adjustSpeechBubbleSize()에서 꼬리는 항상 하단 12px 영역에 위치 (3단 계단형)
const TAIL_TIP_OFFSET = 12;

/**
 * 말풍선 앵커 업데이트
 *
 * 캐릭터 이미지의 top center를 기준으로 말풍선 위치를 계산하고
 * CSS 커스텀 프로퍼티로 주입
 *
 * 불변 조건:
 * - 꼬리 tip은 항상 캐릭터 정중앙(top center) 위에 위치
 * - 캐릭터 top과 꼬리 tip 사이 거리는 IDEAL_GAP(8px)
 * - Gap 제약: MIN_GAP(4px) ~ MAX_GAP(14px)
 */
export function updateSpeechBubbleAnchor() {
  const characterImg = document.querySelector('.character-img');
  const speechBubble = document.querySelector('.speech-bubble');

  if (!characterImg || !speechBubble) return;

  // Get character's bounding rect (includes transforms)
  const rect = characterImg.getBoundingClientRect();

  // 캐릭터 top-center 좌표
  const characterTopCenterX = rect.left + (rect.width / 2);
  const characterTopY = rect.top;

  // 꼬리 tip의 실제 Y 좌표 (캐릭터 top 위 IDEAL_GAP 떨어진 위치)
  const tailTipTargetY = characterTopY - IDEAL_GAP;

  // 말풍선 SVG bottom 위치 계산
  // SVG의 bottom이 tailTipTargetY - TAIL_TIP_OFFSET에 위치해야 함
  // (꼬리 tip은 SVG bottom으로부터 TAIL_TIP_OFFSET만큼 위에 있음)
  const anchorBottom = window.innerHeight - (tailTipTargetY - TAIL_TIP_OFFSET);

  // Gap 제약 검증 (실제 gap = 캐릭터 top과 꼬리 tip 사이 거리)
  const actualGap = characterTopY - tailTipTargetY;
  if (actualGap < MIN_GAP || actualGap > MAX_GAP) {
    console.warn(`[Anchor] Gap constraint violated: ${actualGap.toFixed(1)}px (allowed: ${MIN_GAP}~${MAX_GAP}px)`);
  }

  // Inject CSS variables
  speechBubble.style.setProperty('--anchor-left', `${characterTopCenterX}px`);
  speechBubble.style.setProperty('--anchor-bottom', `${anchorBottom}px`);
}

// 말풍선 크기 조정 토큰 (동시 호출 시 마지막 호출만 유효)
let resizeToken = 0;

/**
 * 말풍선 크기 동적 조정
 *
 * 텍스트 내용에 맞게 SVG 크기를 조정하고,
 * 픽셀 아트 테두리와 3단 계단형 꼬리를 정확하게 유지
 *
 * @param {string} textElementId - 텍스트 요소 ID (기본: 'explanationText')
 * @param {number|null} questionToken - 문제 토큰 (null이면 체크 안 함)
 * @param {Function|null} getQuestionToken - questionToken을 가져오는 함수 (null이면 체크 안 함)
 */
export function adjustSpeechBubbleSize(textElementId = 'explanationText', questionToken = null, getQuestionToken = null) {
  // 가장 최신 호출만 유효하도록 토큰 증가
  const myToken = ++resizeToken;
  const myQuestionToken = questionToken;

  const bubble = document.querySelector('.speech-bubble');
  const textElement = document.getElementById(textElementId);
  const svgElement = bubble?.querySelector('.speech-bubble-svg');

  if (!bubble || !textElement || !svgElement) return;

  // 완전히 초기화: SVG 크기를 최소로 리셋
  svgElement.setAttribute('height', '60');
  svgElement.setAttribute('viewBox', '0 0 328 60');

  // 텍스트 엘리먼트 초기화
  textElement.style.height = 'auto';
  textElement.style.maxHeight = 'none';
  textElement.style.overflow = 'visible';

  // 강제 리플로우로 브라우저에게 레이아웃 재계산 요청
  void textElement.offsetHeight;

  // 실제 텍스트 높이 측정 (약간의 딜레이로 정확한 측정)
  setTimeout(() => {
    // 오래된 호출이면 즉시 중단 (다른 문제/텍스트로 갱신된 상태)
    if (myToken !== resizeToken) return;

    // 문제 토큰 체크 - 다른 문제로 넘어갔으면 중단
    if (myQuestionToken !== null && getQuestionToken && myQuestionToken !== getQuestionToken()) {
      return;
    }
    // 현재 텍스트의 실제 높이 측정
    const textHeight = textElement.scrollHeight;

    // 최소 높이 설정
    const minTextHeight = 20;
    const topPadding = 8;    // 기존 12px → 8px (위 여백 4px 감소)
    const bottomPadding = 8; // 기존 12px → 8px (아래 여백 4px 감소)

    // 실제 필요한 텍스트 영역 높이 (최소값 보장)
    const actualTextHeight = Math.max(minTextHeight, textHeight);

    // 메인 사각형 높이 = 텍스트 높이 + 최소 여백
    const contentHeight = actualTextHeight + topPadding + bottomPadding;

    // 전체 SVG 높이 = 상단(10) + 컨텐츠 + 하단(10) + 꼬리(12)
    // 꼬리 규격: 얄쌍한 3단 계단형 (12px, 8px, 4px) × 4px 높이 = 총 12px
    const svgHeight = 10 + contentHeight + 10 + 12;
    const svgWidth = 328; // 320 + 8 (두 칸 확장)

    // SVG viewBox와 height 설정
    // SVG viewBox와 height 설정 (동적 높이 반영)
    svgElement.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svgElement.setAttribute('height', svgHeight);
    svgElement.setAttribute('width', svgWidth);
    // CSS에서도 높이를 참조할 수 있도록 커스텀 속성으로 주입
    svgElement.style.setProperty('--bubble-svg-height', `${svgHeight}px`);

    // 기존 모든 rect 제거하고 새로 그리기
    svgElement.innerHTML = '';

    // 메인 사각형 본체
    addRect(svgElement, 20, 10, 288, contentHeight, '#FFF');

    // 픽셀 테두리 - 상단
    addRect(svgElement, 24, 6, 280, 4, '#000');

    // 픽셀 테두리 - 좌측 상단 모서리
    addRect(svgElement, 20, 10, 4, 4, '#000');
    addRect(svgElement, 16, 14, 4, 4, '#000');
    addRect(svgElement, 12, 18, 4, contentHeight - 14, '#000');

    // 좌측 하단 모서리
    const leftBottomY = 10 + contentHeight;
    addRect(svgElement, 16, leftBottomY - 4, 4, 4, '#000');
    addRect(svgElement, 20, leftBottomY, 4, 4, '#000');

    // 캐릭터-말풍선 고정 정렬 로직: 꼬리 중앙 고정을 위한 centerX 기준 계산
    const centerX = svgWidth / 2; // 328 / 2 = 164

    // 얄쌍한 3단 계단형 꼬리 규격
    const tailTopWidth = 12;    // 꼬리 상단 폭
    const tailMidWidth = 8;     // 꼬리 중단 폭
    const tailTipWidth = 4;     // 꼬리 끝 폭
    const stepHeight = 4;       // 각 단의 높이

    // 하단 테두리 (꼬리 왼쪽 부분 - 중앙까지)
    const bottomY = leftBottomY + 4;
    const leftBorderWidth = centerX - 24 - (tailTopWidth / 2);
    addRect(svgElement, 24, bottomY, leftBorderWidth, 4, '#000');

    // 픽셀 테두리 - 우측 상단 모서리
    addRect(svgElement, 304, 10, 4, 4, '#000');
    addRect(svgElement, 308, 14, 4, 4, '#000');
    addRect(svgElement, 312, 18, 4, contentHeight - 14, '#000');

    // 우측 하단 모서리
    addRect(svgElement, 308, leftBottomY, 4, 4, '#000');
    addRect(svgElement, 312, leftBottomY - 4, 4, 4, '#000');

    // 하단 테두리 (꼬리 오른쪽 부분 - 중앙부터)
    const rightBorderStartX = centerX + (tailTopWidth / 2);
    const rightBorderWidth = 312 - rightBorderStartX;
    addRect(svgElement, rightBorderStartX, bottomY, rightBorderWidth, 4, '#000');

    // 꼬리 Level 1 (상단): 폭 12px, centerX ± 6
    const tail1Y = bottomY + 4;
    addRect(svgElement, centerX - (tailTopWidth / 2), tail1Y, tailTopWidth, stepHeight, '#FFF');
    addRect(svgElement, centerX - (tailTopWidth / 2) - 4, tail1Y, 4, stepHeight, '#000'); // 좌측 테두리
    addRect(svgElement, centerX + (tailTopWidth / 2), tail1Y, 4, stepHeight, '#000');     // 우측 테두리

    // 꼬리 Level 2 (중단): 폭 8px, centerX ± 4
    const tail2Y = tail1Y + stepHeight;
    addRect(svgElement, centerX - (tailMidWidth / 2), tail2Y, tailMidWidth, stepHeight, '#FFF');
    addRect(svgElement, centerX - (tailMidWidth / 2) - 4, tail2Y, 4, stepHeight, '#000');
    addRect(svgElement, centerX + (tailMidWidth / 2), tail2Y, 4, stepHeight, '#000');

    // 꼬리 Level 3 (끝): 폭 4px, centerX ± 2
    const tail3Y = tail2Y + stepHeight;
    addRect(svgElement, centerX - (tailTipWidth / 2), tail3Y, tailTipWidth, stepHeight, '#000'); // 끝은 검정

    // 캐릭터-말풍선 고정 정렬 로직: SVG 크기 변경 후 앵커 재계산
    updateSpeechBubbleAnchor();
  }, 10);
}

/**
 * SVG rect 요소 추가 헬퍼
 */
function addRect(svgElement, x, y, width, height, fill) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', width);
  rect.setAttribute('height', height);
  rect.setAttribute('fill', fill);
  rect.setAttribute('stroke', 'none');
  svgElement.appendChild(rect);
}

/**
 * 말풍선 앵커 이벤트 리스너 초기화
 *
 * resize, scroll, 캐릭터 이미지 load, DOM 변경 시 앵커 재계산
 */
export function initSpeechBubbleAnchor() {
  // 초기 앵커 설정
  updateSpeechBubbleAnchor();

  // 리사이즈/스크롤 시 앵커 재계산
  window.addEventListener('resize', updateSpeechBubbleAnchor);
  window.addEventListener('scroll', updateSpeechBubbleAnchor);

  // 캐릭터 이미지 로드 완료 후 앵커 재계산
  const characterImg = document.querySelector('.character-img');
  if (characterImg) {
    if (characterImg.complete) {
      // 이미 로드된 경우
      updateSpeechBubbleAnchor();
    } else {
      // 로드 대기
      characterImg.addEventListener('load', updateSpeechBubbleAnchor, { once: true });
    }
  }

  // 애니메이션/전환 후에도 앵커 재계산 (MutationObserver)
  const characterSection = document.querySelector('.character-section');
  if (characterSection) {
    const observer = new MutationObserver(updateSpeechBubbleAnchor);
    observer.observe(characterSection, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
}
