'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sso_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      setting_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Setting key (e.g., swing_sso_enabled, auto_create_user)'
      },
      setting_value: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Setting value (JSON string for complex values)'
      },
      data_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'string',
        comment: 'Data type of the setting value: string, boolean, number, or json'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the setting'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'general',
        comment: 'Setting category (e.g., general, api, access_control)'
      },
      is_editable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the setting can be edited via UI'
      },
      is_sensitive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the setting contains sensitive data'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique index on setting_key
    await queryInterface.addIndex('sso_settings', ['setting_key'], {
      name: 'idx_sso_settings_key',
      unique: true
    });

    // Add index on category
    await queryInterface.addIndex('sso_settings', ['category'], {
      name: 'idx_sso_settings_category'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sso_settings');
  }
};
