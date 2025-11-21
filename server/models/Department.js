const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '부서명'
    },
    total_members: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '총 인원'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '부서 설명'
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  return Department;
};

