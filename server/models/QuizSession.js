const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizSession = sequelize.define('QuizSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quiz_events',
        key: 'id'
      }
    },
    session_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '회차 번호 (1, 2, 3)'
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed'),
      defaultValue: 'in_progress',
      allowNull: false
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    won_prize_this_session: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '이번 세션에서 선물을 획득했는지 여부'
    }
  }, {
    tableName: 'quiz_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'event_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  return QuizSession;
};
