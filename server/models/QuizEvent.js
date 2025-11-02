const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizEvent = sequelize.define('QuizEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '이벤트 제목 (예: 2025년 1월 내규 퀴즈)'
    },
    year_month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: true,
      comment: '년월 (YYYY-MM)'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '시작일'
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '종료일'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '활성화 여부'
    }
  }, {
    tableName: 'quiz_events',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['year_month']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return QuizEvent;
};
