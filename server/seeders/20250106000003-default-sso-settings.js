'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultSettings = [
      // General Settings
      {
        setting_key: 'swing_sso_enabled',
        setting_value: 'false',
        data_type: 'boolean',
        description: 'Enable/Disable Swing SSO authentication',
        category: 'general',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'swing_sso_environment',
        setting_value: 'mock',
        data_type: 'string',
        description: 'Swing SSO environment: prod, dev, or mock',
        category: 'general',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'auto_create_user',
        setting_value: 'true',
        data_type: 'boolean',
        description: 'Automatically create user account on first SSO login',
        category: 'general',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'sync_user_info',
        setting_value: 'true',
        data_type: 'boolean',
        description: 'Sync user information from Swing SSO on every login',
        category: 'general',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },

      // API Configuration
      {
        setting_key: 'api_base_url',
        setting_value: 'http://127.0.0.1:8055/swing-mock-server',
        data_type: 'string',
        description: 'Swing API base URL',
        category: 'api',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'oauth_endpoint',
        setting_value: '/cau/v1/oauth-code-simple',
        data_type: 'string',
        description: 'Swing OAuth endpoint path',
        category: 'api',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'idpw_endpoint',
        setting_value: '/cau/v1/idpw-authorize',
        data_type: 'string',
        description: 'Swing ID/Password authentication endpoint path',
        category: 'api',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'client_id',
        setting_value: 'mock_client_id',
        data_type: 'string',
        description: 'Swing API client ID',
        category: 'api',
        is_editable: true,
        is_sensitive: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'client_secret',
        setting_value: 'mock_client_secret',
        data_type: 'string',
        description: 'Swing API client secret',
        category: 'api',
        is_editable: true,
        is_sensitive: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Access Control Settings
      {
        setting_key: 'access_control_type',
        setting_value: 'none',
        data_type: 'string',
        description: 'Access control type: none, employee_list, department_list, or collection',
        category: 'access_control',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'employee_list',
        setting_value: '[]',
        data_type: 'json',
        description: 'List of allowed employee IDs (JSON array)',
        category: 'access_control',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'department_list',
        setting_value: '[]',
        data_type: 'json',
        description: 'List of allowed departments (JSON array)',
        category: 'access_control',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Security Settings
      {
        setting_key: 'password_salt',
        setting_value: 'DEFAULT_SALT_CHANGE_IN_PRODUCTION',
        data_type: 'string',
        description: 'Salt for password hashing (change in production)',
        category: 'security',
        is_editable: true,
        is_sensitive: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        setting_key: 'api_timeout',
        setting_value: '10000',
        data_type: 'number',
        description: 'API request timeout in milliseconds',
        category: 'api',
        is_editable: true,
        is_sensitive: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('sso_settings', defaultSettings, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sso_settings', null, {});
  }
};
