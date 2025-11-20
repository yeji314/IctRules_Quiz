const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LuckyDraw = sequelize.define('LuckyDraw', {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    prize: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '기프티콘 종류'
    },
    won_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '당첨일'
    },
    is_claimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '수령 여부'
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '수령일'
    }
  }, {
    tableName: 'lucky_draws',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['event_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['is_claimed']
      }
    ]
  });

  return LuckyDraw;
};
