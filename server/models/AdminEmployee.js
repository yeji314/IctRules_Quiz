const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminEmployee = sequelize.define('AdminEmployee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employee_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '관리자 권한 행번'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '관리자 이름 (참고용)'
    },
    added_by: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '추가한 관리자 행번'
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '기본 관리자 여부 (삭제 불가)'
    }
  }, {
    tableName: 'admin_employees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return AdminEmployee;
};
