const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SSOSettings = sequelize.define('SSOSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Setting key (e.g., swing_sso_enabled, auto_create_user)'
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Setting value (JSON string for complex values)'
    },
    data_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'string',
      comment: 'Data type of the setting value: string, boolean, number, or json'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the setting'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'general',
      comment: 'Setting category (e.g., general, api, access_control)'
    },
    is_editable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the setting can be edited via UI'
    },
    is_sensitive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the setting contains sensitive data'
    }
  }, {
    tableName: 'sso_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['setting_key']
      },
      {
        fields: ['category']
      }
    ]
  });

  // Helper method to get setting value with type conversion
  SSOSettings.prototype.getValue = function() {
    if (!this.setting_value) return null;

    switch (this.data_type) {
      case 'boolean':
        return this.setting_value === 'true' || this.setting_value === '1';
      case 'number':
        return parseFloat(this.setting_value);
      case 'json':
        try {
          return JSON.parse(this.setting_value);
        } catch (e) {
          return null;
        }
      case 'string':
      default:
        return this.setting_value;
    }
  };

  // Helper method to set setting value with type conversion
  SSOSettings.prototype.setValue = function(value) {
    if (value === null || value === undefined) {
      this.setting_value = null;
      return;
    }

    switch (this.data_type) {
      case 'boolean':
        this.setting_value = value ? 'true' : 'false';
        break;
      case 'number':
        this.setting_value = String(value);
        break;
      case 'json':
        this.setting_value = JSON.stringify(value);
        break;
      case 'string':
      default:
        this.setting_value = String(value);
    }
  };

  // JSON serialization - hide sensitive values
  SSOSettings.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    if (this.is_sensitive && values.setting_value) {
      values.setting_value = '***HIDDEN***';
    }
    return values;
  };

  // Static method to get setting by key
  SSOSettings.getSetting = async function(key, defaultValue = null) {
    const setting = await this.findOne({ where: { setting_key: key } });
    return setting ? setting.getValue() : defaultValue;
  };

  // Static method to set setting by key
  SSOSettings.setSetting = async function(key, value, options = {}) {
    const [setting, created] = await this.findOrCreate({
      where: { setting_key: key },
      defaults: {
        setting_value: String(value),
        data_type: options.dataType || 'string',
        description: options.description || '',
        category: options.category || 'general',
        is_editable: options.isEditable !== undefined ? options.isEditable : true,
        is_sensitive: options.isSensitive !== undefined ? options.isSensitive : false
      }
    });

    if (!created) {
      setting.setValue(value);
      await setting.save();
    }

    return setting;
  };

  // Static method to get all settings by category
  SSOSettings.getByCategory = async function(category) {
    const settings = await this.findAll({ where: { category } });
    return settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.getValue();
      return acc;
    }, {});
  };

  return SSOSettings;
};
