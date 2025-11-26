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
      type: DataTypes.ENUM('drag_and_drop', 'typing', 'fill_in_blank', 'ox', 'best_action'),
      allowNull: false,
      comment: '문제 유형: drag_and_drop(4지선다), typing, fill_in_blank(4지선다), ox, best_action(상황형 4지선다)'
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
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Admin이 등록한 문제 요약 (result 페이지에 표시)'
    },
    highlight: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '요약 텍스트에서 하이라이트할 키워드/문장'
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
