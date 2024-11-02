// fileHandling.js

class FileHandler {
    constructor(supportedFormats = ['wav', 'mp3', 'ogg', 'flac']) {
      this.supportedFormats = supportedFormats;
      this.maxFileSize = 2 * 1024 * 1024 * 1024; // 2GB
    }
  
    async processFiles(files) {
      const validFiles = [];
      const errors = [];
  
      for (const file of files) {
        try {
          if (await this.validateFile(file)) {
            validFiles.push(file);
          }
        } catch (error) {
          errors.push({ file: file.name, error });
        }
      }
  
      return { validFiles, errors };
    }
  
    async validateFile(file) {
      // בדיקת סוג הקובץ
      const extension = file.name.split('.').pop().toLowerCase();
      if (!this.supportedFormats.includes(extension)) {
        throw new Error(`Unsupported file format: ${extension}`);
      }
  
      // בדיקת גודל הקובץ
      if (file.size > this.maxFileSize) {
        throw new Error('File size exceeds maximum limit');
      }
  
      // בדיקת תקינות הקובץ
      try {
        await this.checkFileIntegrity(file);
        return true;
      } catch (error) {
        throw new Error('File integrity check failed');
      }
    }
  
    async checkFileIntegrity(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => resolve(true);
        reader.onerror = () => reject(new Error('File read error'));
        
        reader.readAsArrayBuffer(file.slice(0, 8192)); // קריאת ה-header בלבד
      });
    }
  
    async organizeFiles(files, destinationPath) {
      const organized = {
        drums: [],
        bass: [],
        synth: [],
        instrument: [],
        other: []
      };
  
      for (const file of files) {
        const category = await this.detectFileCategory(file);
        organized[category].push(file);
      }
  
      return organized;
    }
  
    async detectFileCategory(file) {
      // ניתוח בסיסי של שם הקובץ וmetadata
      const fileName = file.name.toLowerCase();
      
      if (fileName.includes('kick') || fileName.includes('snare') || fileName.includes('hat')) {
        return 'drums';
      }
      if (fileName.includes('bass')) {
        return 'bass';
      }
      if (fileName.includes('synth')) {
        return 'synth';
      }
      if (fileName.includes('guitar') || fileName.includes('piano')) {
        return 'instrument';
      }
      
      return 'other';
    }
  
    async createFileStructure(basePath, categories) {
      const structure = {};
      
      for (const category of Object.keys(categories)) {
        const categoryPath = `${basePath}/${category}`;
        structure[category] = {
          path: categoryPath,
          subfolders: await this.createCategorySubfolders(categoryPath)
        };
      }
      
      return structure;
    }
  
    async createCategorySubfolders(categoryPath) {
      // יצירת תת-תיקיות לפי קטגוריה
      const subfolders = {
        drums: ['kicks', 'snares', 'hats', 'percussion'],
        bass: ['808', 'synth', 'acoustic'],
        synth: ['leads', 'pads', 'fx'],
        instrument: ['guitar', 'piano', 'strings']
      };
      
      return subfolders[categoryPath.split('/').pop()] || [];
    }
  
    async moveFile(file, destination) {
      try {
        // העתקת הקובץ ליעד החדש
        const response = await fetch(file.path);
        const blob = await response.blob();
        
        const newPath = `${destination}/${file.name}`;
        // שמירת הקובץ ביעד החדש
        
        return newPath;
      } catch (error) {
        throw new Error(`Failed to move file: ${error.message}`);
      }
    }
  
    async generateUniqueFileName(basePath, fileName) {
      let newFileName = fileName;
      let counter = 1;
      
      while (await this.fileExists(`${basePath}/${newFileName}`)) {
        const nameParts = fileName.split('.');
        const extension = nameParts.pop();
        const name = nameParts.join('.');
        newFileName = `${name}_${counter}.${extension}`;
        counter++;
      }
      
      return newFileName;
    }
  
    async fileExists(path) {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    }
  
    async createMetadataFile(directory, files) {
      const metadata = {
        timestamp: new Date().toISOString(),
        totalFiles: files.length,
        categories: {},
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          category: file.category,
          analyzedData: file.analyzedData
        }))
      };
  
      // קטגוריזציה וספירה
      files.forEach(file => {
        if (!metadata.categories[file.category]) {
          metadata.categories[file.category] = 0;
        }
        metadata.categories[file.category]++;
      });
  
      // שמירת קובץ המטאדאטה
      return metadata;
    }
  }
  
  export default FileHandler;