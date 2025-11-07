'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add swing_user_id column (without unique constraint initially for SQLite compatibility)
    await queryInterface.addColumn('users', 'swing_user_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Swing SSO User ID'
    });

    // Add position column
    await queryInterface.addColumn('users', 'position', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Position/Title'
    });

    // Add is_active column
    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Active status'
    });

    // Add login_method column
    await queryInterface.addColumn('users', 'login_method', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'local',
      comment: 'Authentication method: local or swing_sso'
    });

    // Add unique index on swing_user_id for faster lookups
    await queryInterface.addIndex('users', ['swing_user_id'], {
      name: 'idx_users_swing_user_id',
      unique: true
    });

    // Add index on login_method for filtering
    await queryInterface.addIndex('users', ['login_method'], {
      name: 'idx_users_login_method'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('users', 'idx_users_swing_user_id');
    await queryInterface.removeIndex('users', 'idx_users_login_method');

    // Remove columns
    await queryInterface.removeColumn('users', 'swing_user_id');
    await queryInterface.removeColumn('users', 'position');
    await queryInterface.removeColumn('users', 'is_active');
    await queryInterface.removeColumn('users', 'login_method');
  }
};
