const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quiz_events',
        key: 'id'
      }
    },
    question_type: {
      type: DataTypes.ENUM('drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'find_error'),
      allowNull: false,
      comment: '문제 유형'
    },
    category: {
      type: DataTypes.ENUM('normal', 'luckydraw'),
      defaultValue: 'normal',
      allowNull: false,
      comment: '일반 문제 또는 LuckyDraw'
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '문제 내용'
    },
    question_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: '문제 유형별 데이터 (options, correct_answer 등)',
      defaultValue: {}
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '정답 해설'
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '문제 순서'
    }
  }, {
    tableName: 'questions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['event_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['question_type']
      }
    ]
  });

  return Question;
};
