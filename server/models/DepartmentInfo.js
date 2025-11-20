const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DepartmentInfo = sequelize.define('DepartmentInfo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    department_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '부서명'
    },
    target_headcount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '목표 인원 수'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '부서 설명'
    }
  }, {
    tableName: 'department_info',
    timestamps: true,
    underscored: true
  });

  return DepartmentInfo;
};
