// install.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class Installer {
  constructor() {
    this.config = {
      appName: 'Sample Manager',
      version: '1.0.0',
      requiredSpace: 500 * 1024 * 1024, // 500MB
      flStudioPath: '',
      samplesPath: ''
    };
  }

  async install() {
    try {
      console.log('Starting installation...');
      
      // בדיקות מקדימות
      await this.checkRequirements();
      
      // יצירת תיקיות
      await this.createDirectories();
      
      // התקנת תלויות
      await this.installDependencies();
      
      // התקנת ה-DLL
      await this.installFLStudioPlugin();
      
      // קונפיגורציה ראשונית
      await this.initialConfiguration();
      
      console.log('Installation completed successfully!');
    } catch (error) {
      console.error('Installation failed:', error);
      this.rollback();
      process.exit(1);
    }
  }

  async checkRequirements() {
    console.log('Checking system requirements...');
    
    // בדיקת מערכת ההפעלה
    if (process.platform !== 'win32') {
      throw new Error('Windows OS is required');
    }
    
    // בדיקת גרסת Node.js
    const nodeVersion = process.version;
    if (parseInt(nodeVersion.slice(1)) < 14) {
      throw new Error('Node.js 14 or higher is required');
    }
    
    // בדיקת נפח דיסק פנוי
    await this.checkDiskSpace();
    
    // בדיקת FL Studio
    await this.findFLStudio();
  }

  async checkDiskSpace() {
    // בדיקת נפח פנוי בדיסק
    return new Promise((resolve, reject) => {
      exec('wmic logicaldisk get size,freespace', (error, stdout) => {
        if (error) reject(error);
        
        const lines = stdout.trim().split('\n');
        const freeSpace = parseInt(lines[1].trim().split(/\s+/)[0]);
        
        if (freeSpace < this.config.requiredSpace) {
          reject(new Error('Insufficient disk space'));
        }
        
        resolve();
      });
    });
  }

  async findFLStudio() {
    const commonPaths = [
      'C:\\Program Files\\Image-Line\\FL Studio 20',
      'C:\\Program Files (x86)\\Image-Line\\FL Studio 20'
    ];
    
    for (const path of commonPaths) {
      if (fs.existsSync(path)) {
        this.config.flStudioPath = path;
        return;
      }
    }
    
    throw new Error('FL Studio installation not found');
  }

  async createDirectories() {
    const dirs = [
      './logs',
      './samples',
      './cache',
      './config'
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async installDependencies() {
    return new Promise((resolve, reject) => {
      exec('npm install', (error) => {
        if (error) reject(error);
        resolve();
      });
    });
  }

  async installFLStudioPlugin() {
    const pluginSource = path.join(__dirname, 'dll', 'SampleManager.dll');
    const pluginDest = path.join(this.config.flStudioPath, 'Plugins', 'VST', 'SampleManager.dll');
    
    fs.copyFileSync(pluginSource, pluginDest);
  }

  async initialConfiguration() {
    const config = {
      flStudioPath: this.config.flStudioPath,
      samplesPath: path.join(process.cwd(), 'samples'),
      logPath: path.join(process.cwd(), 'logs'),
      cachePath: path.join(process.cwd(), 'cache')
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'config', 'config.json'),
      JSON.stringify(config, null, 2)
    );
  }

  rollback() {
    console.log('Rolling back installation...');
    
    // מחיקת תיקיות שנוצרו
    const dirs = ['logs', 'samples', 'cache', 'config'];
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, { recursive: true });
      }
    }
    
    // הסרת ה-DLL
    const pluginPath = path.join(
      this.config.flStudioPath,
      'Plugins',
      'VST',
      'SampleManager.dll'
    );
    if (fs.existsSync(pluginPath)) {
      fs.unlinkSync(pluginPath);
    }
  }
}

// הפעלת ההתקנה
new Installer().install();