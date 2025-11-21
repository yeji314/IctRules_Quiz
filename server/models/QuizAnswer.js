const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizAnswer = sequelize.define('QuizAnswer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quiz_sessions',
        key: 'id'
      }
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      }
    },
    user_answer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '사용자 답변'
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: '정답 여부'
    },
    answer_attempt: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '시도 횟수 (1=첫 시도, 2+=재시도)'
    },
    time_taken: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '소요 시간 (초)'
    },
    answered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_lucky_draw: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '럭키드로우 문제 여부'
    }
  }, {
    tableName: 'quiz_answers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['session_id']
      },
      {
        fields: ['question_id']
      },
      {
        fields: ['is_correct']
      }
    ]
  });

  return QuizAnswer;
};
