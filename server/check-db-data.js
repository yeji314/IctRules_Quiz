const db = require('./models');

async function checkData() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully\n');

    // Check users
    const users = await db.User.findAll();
    console.log(`Users: ${users.length}`);
    users.forEach(u => console.log(`  - ${u.employee_id}: ${u.name} (${u.role})`));

    // Check events
    const events = await db.QuizEvent.findAll();
    console.log(`\nQuiz Events: ${events.length}`);
    events.forEach(e => console.log(`  - ${e.id}: ${e.title} (${e.year_month}) - Active: ${e.is_active}`));

    // Check questions
    const questions = await db.Question.findAll();
    console.log(`\nQuestions: ${questions.length}`);
    const normalCount = questions.filter(q => q.category === 'normal').length;
    const luckyCount = questions.filter(q => q.category === 'luckydraw').length;
    console.log(`  - Normal: ${normalCount}`);
    console.log(`  - LuckyDraw: ${luckyCount}`);

    // Check sessions
    const sessions = await db.QuizSession.findAll();
    console.log(`\nQuiz Sessions: ${sessions.length}`);

    // Check answers
    const answers = await db.QuizAnswer.findAll();
    console.log(`Quiz Answers: ${answers.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkData();
