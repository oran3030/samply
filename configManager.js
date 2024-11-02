// configManager.js

class ConfigManager {
    constructor() {
      this.defaultConfig = {
        audio: {
          sampleRate: 44100,
          bitDepth: 24,
          bufferSize: 4096,
          maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
        },
        analysis: {
          minBPM: 60,
          maxBPM: 200,
          bpmAccuracy: 0.5,
          keyDetectionSensitivity: 0.8
        },
        folders: {
          samplesRoot: '',
          categories: {
            drums: ['kicks', 'snares', 'hats', 'percussion'],
            bass: ['808', 'synth', 'acoustic'],
            synth: ['leads', 'pads', 'fx'],
            instrument: ['guitar', 'piano', 'strings']
          }
        },
        flStudio: {
          pluginPath: '',
          autoSync: true,
          syncBPM: true,
          syncKey: true,
          autoStretch: true
        },
        interface: {
          theme: 'dark',
          language: 'he',
          waveformDetail: 'medium',
          gridSize: 3,
          autoPlay: false,
          previewDuration: 2
        }
      };
      
      this.currentConfig = { ...this.defaultConfig };
    }
  
    async loadConfig() {
      try {
        const savedConfig = localStorage.getItem('sampleManagerConfig');
        if (savedConfig) {
          this.currentConfig = {
            ...this.defaultConfig,
            ...JSON.parse(savedConfig)
          };
        }
        return this.currentConfig;
      } catch (error) {
        console.error('Failed to load config:', error);
        return this.defaultConfig;
      }
    }
  
    async saveConfig() {
      try {
        localStorage.setItem('sampleManagerConfig', 
          JSON.stringify(this.currentConfig)
        );
        return true;
      } catch (error) {
        console.error('Failed to save config:', error);
        return false;
      }
    }
  
    updateConfig(section, updates) {
      this.currentConfig[section] = {
        ...this.currentConfig[section],
        ...updates
      };
      return this.saveConfig();
    }
  
    resetConfig(section = null) {
      if (section) {
        this.currentConfig[section] = { ...this.defaultConfig[section] };
      } else {
        this.currentConfig = { ...this.defaultConfig };
      }
      return this.saveConfig();
    }
  
    validateConfig(config = this.currentConfig) {
      const errors = [];
  
      // בדיקת הגדרות אודיו
      if (config.audio.sampleRate < 44100) {
        errors.push('Sample rate too low');
      }
      if (config.audio.bufferSize < 512) {
        errors.push('Buffer size too small');
      }
  
      // בדיקת הגדרות ניתוח
      if (config.analysis.minBPM < 20 || config.analysis.maxBPM > 400) {
        errors.push('Invalid BPM range');
      }
  
      // בדיקת נתיבי תיקיות
      if (!config.folders.samplesRoot) {
        errors.push('Samples root folder not set');
      }
  
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    getConfigValue(path) {
      return path.split('.').reduce((obj, key) => 
        obj && obj[key] !== undefined ? obj[key] : null, 
        this.currentConfig
      );
    }
  
    setConfigValue(path, value) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((obj, key) => 
        obj[key] = obj[key] || {}, 
        this.currentConfig
      );
      target[lastKey] = value;
      return this.saveConfig();
    }
  
    async exportConfig() {
      return {
        config: this.currentConfig,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
    }
  
    async importConfig(configData) {
      try {
        const parsedConfig = JSON.parse(configData);
        // בדיקת תאימות גרסה
        if (this.validateConfig(parsedConfig.config).isValid) {
          this.currentConfig = parsedConfig.config;
          return this.saveConfig();
        }
        throw new Error('Invalid config format');
      } catch (error) {
        console.error('Failed to import config:', error);
        return false;
      }
    }
  }
  
  export default ConfigManager;
