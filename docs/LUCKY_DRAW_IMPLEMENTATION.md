# Lucky Draw Sequential Question Selection Implementation

## Overview
This document describes the implementation of sequential lucky draw question selection that prevents consecutive lucky draw questions from appearing.

## Requirements

### User Requirements
1. **Regular questions**: Randomly selected, no duplicates, no previously answered questions
2. **Lucky draw questions**:
   - **First lucky draw**: Appears when user gets 3+ questions correct on first attempt (across all previous sessions in the event)
   - **Second lucky draw onwards**: Can appear randomly like regular questions (no duplicates, no previously answered questions)
   - **IMPORTANT**: A lucky draw question cannot appear immediately after another lucky draw question

## Implementation Changes

### 1. Modified `getWeightedRandomQuestions` Method
**File**: `server/services/quizService.js`

**Key Changes**:
- Added `lastWasLucky` flag to track if the previous question was a lucky draw
- If previous question was lucky draw, force next question to be normal
- Ensures sequential selection maintains the no-consecutive-lucky-draws rule
- Removed final shuffle to preserve the carefully constructed sequence

**Code**:
```javascript
getWeightedRandomQuestions(normalQuestions, luckyQuestions, count, luckyWeight) {
  const selected = [];
  const normalPool = [...normalQuestions];
  const luckyPool = [...luckyQuestions];
  let lastWasLucky = false; // Track if previous question was lucky draw

  while (selected.length < count && (normalPool.length > 0 || luckyPool.length > 0)) {
    let isLucky = Math.random() < luckyWeight && luckyPool.length > 0;

    // If previous was lucky draw, force next to be normal
    if (lastWasLucky) {
      isLucky = false;
    }

    if (isLucky && !lastWasLucky) {
      // Select lucky draw
      const idx = Math.floor(Math.random() * luckyPool.length);
      selected.push(luckyPool[idx]);
      luckyPool.splice(idx, 1);
      lastWasLucky = true;
    } else if (normalPool.length > 0) {
      // Select normal question
      const idx = Math.floor(Math.random() * normalPool.length);
      selected.push(normalPool[idx]);
      normalPool.splice(idx, 1);
      lastWasLucky = false;
    } else if (luckyPool.length > 0) {
      // Only if normal pool is empty and previous wasn't lucky
      if (!lastWasLucky) {
        const idx = Math.floor(Math.random() * luckyPool.length);
        selected.push(luckyPool[idx]);
        luckyPool.splice(idx, 1);
        lastWasLucky = true;
      } else {
        // Cannot proceed without violating constraint
        console.warn('[QuizService] Warning: Cannot avoid consecutive lucky draws');
        break;
      }
    }
  }

  return selected; // Return without shuffling to preserve sequence
}
```

### 2. Updated First Lucky Draw Selection
**File**: `server/services/quizService.js`

**Key Changes**:
- Place first lucky draw at a random middle position (2nd, 3rd, or 4th)
- Avoids placing lucky draw at the very beginning or end
- Ensures better user experience

**Code**:
```javascript
// First LuckyDraw: 4 normal + 1 lucky draw
const selectedNormal = this.shuffleArray(normalQuestions).slice(0, 4);
const selectedLucky = this.shuffleArray(luckyQuestions).slice(0, 1);

// Insert lucky draw at random middle position (2nd, 3rd, or 4th)
const luckyInsertPosition = Math.floor(Math.random() * 3) + 1; // 1, 2, 3
selectedQuestions = [
  ...selectedNormal.slice(0, luckyInsertPosition),
  ...selectedLucky,
  ...selectedNormal.slice(luckyInsertPosition)
];
```

### 3. Added Validation Function
**File**: `server/services/quizService.js`

**Purpose**: Final safety check to ensure no consecutive lucky draws

**Code**:
```javascript
validateNoConsecutiveLuckyDraws(questions) {
  for (let i = 0; i < questions.length - 1; i++) {
    if (questions[i].category === 'luckydraw' && questions[i + 1].category === 'luckydraw') {
      console.error(`[QuizService] Error: Consecutive lucky draws found! Position: ${i + 1}, ${i + 2}`);
      console.error(`[QuizService] Question IDs: ${questions[i].id}, ${questions[i + 1].id}`);
      throw new Error('Consecutive lucky draw questions were selected. This is not allowed.');
    }
  }
  console.log(`[QuizService] ✓ Consecutive lucky draw validation passed`);
  return true;
}
```

## Test Results

### Test Environment
- Database: SQLite (development)
- Test User: user001 (김철수)
- Test Event: 2025-01 (2025년 1월 내규 퀴즈)
- Total Questions: 18 (15 normal + 3 lucky draw)

### Test Scenarios

#### Test 1: Condition Not Met (0-2 correct answers)
- **Expected**: Only normal questions
- **Result**: ✓ PASS
- **Selected Questions**: All 5 were normal questions
- **Lucky Draw Count**: 0

#### Test 2: First Lucky Draw (3+ correct answers)
- **Expected**: 4 normal + 1 lucky draw, no consecutive lucky draws
- **Result**: ✓ PASS
- **Selected Questions**: Q12(normal) -> Q14(normal) -> Q17(luckydraw) -> Q13(normal) -> Q5(normal)
- **Lucky Draw Count**: 1
- **Lucky Draw Position**: 3rd (middle position)

#### Test 3: After Seeing Lucky Draw - Weighted Random (10 iterations)
- **Expected**: Random selection with 40% lucky draw weight, no consecutive lucky draws
- **Result**: ✓ PASS (10/10 = 100%)
- **Sample Sequences**:
  1. N-L-N-N-N ✓
  2. L-N-N-L-N ✓
  3. L-N-N-N-N ✓
  4. L-N-N-N-N ✓
  5. L-N-N-L-N ✓
  6. N-L-N-L-N ✓
  7. N-L-N-L-N ✓
  8. N-N-L-N-N ✓
  9. L-N-N-N-N ✓
  10. N-N-L-N-N ✓

**Key Observations**:
- Lucky draws appear at various positions (1st, 2nd, 3rd, 4th)
- Multiple lucky draws can appear in one set (up to 2 in 5 questions)
- No consecutive lucky draws in any test
- Lucky draws are always separated by at least one normal question

## Algorithm Visualization

### Before (Old Implementation)
```
Select 5 questions with 40% lucky draw weight
↓
Shuffle all selected questions
↓
Possible Result: [L][L][N][N][N]  ← PROBLEM: Consecutive lucky draws!
```

### After (New Implementation)
```
Select questions sequentially with constraint
↓
Track last question type (lastWasLucky flag)
↓
If last was lucky draw → Force next to be normal
↓
Result: [L][N][L][N][N]  ✓ No consecutive lucky draws
```

## Edge Cases Handled

1. **Normal Pool Empty**: If only lucky draws remain and last question was lucky draw, the algorithm will stop rather than violate the constraint
2. **Lucky Pool Empty**: If only normal questions remain, continue selecting normal questions
3. **Both Pools Low**: Algorithm prioritizes maintaining the constraint over filling all 5 slots

## Performance Impact

- **Minimal**: The algorithm adds only one boolean flag check per question selection
- **No additional database queries**: All logic is in-memory
- **Sequential processing**: O(n) where n = number of questions to select (typically 5)

## Future Improvements

1. **Dynamic Lucky Draw Probability**: Adjust probability based on user performance
2. **Lucky Draw Spacing**: Ensure minimum distance between lucky draws (e.g., at least 2 normal questions)
3. **Analytics**: Track lucky draw distribution across all users

## Conclusion

The implementation successfully prevents consecutive lucky draw questions while maintaining random selection and respecting all other constraints (no duplicates, no previously answered questions). All test scenarios pass with 100% success rate.

## Files Modified

1. `server/services/quizService.js`
   - Modified `getWeightedRandomQuestions()` method
   - Updated first lucky draw selection logic
   - Added `validateNoConsecutiveLuckyDraws()` method

## Testing

To run the test suite:
```bash
cd server
node test-lucky-draw-logic.js
```

The test script will:
1. Test condition not met scenario
2. Test first lucky draw scenario
3. Run 10 iterations of weighted random selection
4. Report pass/fail for each test
5. Clean up test data automatically
