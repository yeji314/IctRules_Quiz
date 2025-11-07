require('dotenv').config();

const swingSsoConfig = {
  // Enable/Disable SSO
  enabled: process.env.SWING_SSO_ENABLED === 'true',

  // Environment: prod, dev, mock
  environment: process.env.SWING_SSO_ENV || 'mock',

  // API Configuration
  api: {
    baseUrl: process.env.SWING_API_BASE_URL || 'http://127.0.0.1:8055/swing-mock-server',
    oauthEndpoint: process.env.SWING_OAUTH_ENDPOINT || '/cau/v1/oauth-code-simple',
    idpwEndpoint: process.env.SWING_IDPW_ENDPOINT || '/cau/v1/idpw-authorize',
    timeout: 10000 // 10 seconds
  },

  // Client Credentials
  credentials: {
    clientId: process.env.SWING_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.SWING_CLIENT_SECRET || 'mock_client_secret'
  },

  // User Management
  userManagement: {
    autoCreateUser: process.env.SWING_AUTO_CREATE_USER === 'true',
    syncUserInfo: process.env.SWING_SYNC_USER_INFO === 'true'
  },

  // Access Control
  accessControl: {
    type: process.env.SWING_ACCESS_CONTROL_TYPE || 'none', // none, employee_list, department_list, collection
    employeeListFile: process.env.SWING_EMPLOYEE_LIST_FILE || './config/employees.json',
    departmentListFile: process.env.SWING_DEPARTMENT_LIST_FILE || './config/departments.json',
    collectionName: process.env.SWING_ACCESS_COLLECTION_NAME || 'allowed_users'
  },

  // Password Hashing
  passwordSalt: process.env.SWING_PASSWORD_SALT || 'DEFAULT_SALT_CHANGE_IN_PRODUCTION'
};

// Environment-specific endpoints
const environmentEndpoints = {
  prod: {
    baseUrl: 'https://swing.api.example.com',
    oauthEndpoint: '/cau/v1/oauth-code-simple',
    idpwEndpoint: '/cau/v1/idpw-authorize'
  },
  dev: {
    baseUrl: 'https://swing-dev.api.example.com',
    oauthEndpoint: '/cau/v1/oauth-code-simple',
    idpwEndpoint: '/cau/v1/idpw-authorize'
  },
  mock: {
    baseUrl: 'http://127.0.0.1:8055/swing-mock-server',
    oauthEndpoint: '/cau/v1/oauth-code-simple',
    idpwEndpoint: '/cau/v1/idpw-authorize'
  }
};

// Get endpoint based on environment
function getSwingEndpoint(environment = swingSsoConfig.environment) {
  return environmentEndpoints[environment] || environmentEndpoints.mock;
}

// Validation
function validateConfig() {
  if (!swingSsoConfig.enabled) {
    return { valid: true, message: 'SSO is disabled' };
  }

  const errors = [];

  if (!swingSsoConfig.credentials.clientId || swingSsoConfig.credentials.clientId === 'mock_client_id') {
    errors.push('SWING_CLIENT_ID is not configured properly');
  }

  if (!swingSsoConfig.credentials.clientSecret || swingSsoConfig.credentials.clientSecret === 'mock_client_secret') {
    errors.push('SWING_CLIENT_SECRET is not configured properly');
  }

  if (swingSsoConfig.passwordSalt === 'DEFAULT_SALT_CHANGE_IN_PRODUCTION') {
    errors.push('SWING_PASSWORD_SALT should be changed from default');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, message: 'Configuration is valid' };
}

module.exports = {
  swingSsoConfig,
  getSwingEndpoint,
  validateConfig
};
