// logger.js

class Logger {
    constructor(options = {}) {
      this.options = {
        logLevel: options.logLevel || 'info',
        maxLogAge: options.maxLogAge || 7 * 24 * 60 * 60 * 1000, // שבוע
        maxLogSize: options.maxLogSize || 10 * 1024 * 1024, // 10MB
        logToFile: options.logToFile || true,
        logToConsole: options.logToConsole || true,
        logPath: options.logPath || './logs',
        flStudioLogs: options.flStudioLogs || true
      };
  
      this.logLevels = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3
      };
  
      this.initialize();
    }
  
    initialize() {
      this.currentLogFile = this.createLogFile();
      this.startLogRotation();
    }
  
    createLogFile() {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      return `${this.options.logPath}/sample-manager-${timestamp}.log`;
    }
  
    log(level, message, data = null) {
      if (this.shouldLog(level)) {
        const logEntry = this.formatLogEntry(level, message, data);
        
        if (this.options.logToConsole) {
          this.writeToConsole(level, logEntry);
        }
        
        if (this.options.logToFile) {
          this.writeToFile(logEntry);
        }
      }
    }
  
    formatLogEntry(level, message, data) {
      return {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        data: data ? JSON.stringify(data) : null,
        sessionId: this.getSessionId()
      };
    }
  
    shouldLog(level) {
      return this.logLevels[level] <= this.logLevels[this.options.logLevel];
    }
  
    writeToConsole(level, logEntry) {
      const formattedMessage = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${logEntry.message}`;
      
      switch (level) {
        case 'error':
          console.error(formattedMessage, logEntry.data);
          break;
        case 'warn':
          console.warn(formattedMessage, logEntry.data);
          break;
        case 'info':
          console.info(formattedMessage, logEntry.data);
          break;
        case 'debug':
          console.debug(formattedMessage, logEntry.data);
          break;
      }
    }
  
    async writeToFile(logEntry) {
      try {
        const logString = JSON.stringify(logEntry) + '\n';
        // שמירה לקובץ בצורה אסינכרונית
        await this.appendToFile(this.currentLogFile, logString);
        await this.checkLogRotation();
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  
    async appendToFile(file, data) {
      // הוספת נתונים לקובץ הלוג
    }
  
    async checkLogRotation() {
      try {
        const stats = await this.getFileStats(this.currentLogFile);
        
        if (stats.size > this.options.maxLogSize) {
          await this.rotateLog();
        }
      } catch (error) {
        console.error('Log rotation check failed:', error);
      }
    }
  
    async rotateLog() {
      const newLogFile = this.createLogFile();
      this.currentLogFile = newLogFile;
      await this.cleanOldLogs();
    }
  
    async cleanOldLogs() {
      try {
        const files = await this.getLogFiles();
        const now = Date.now();
        
        for (const file of files) {
          const stats = await this.getFileStats(file);
          if (now - stats.mtime > this.options.maxLogAge) {
            await this.deleteFile(file);
          }
        }
      } catch (error) {
        console.error('Failed to clean old logs:', error);
      }
    }
  
    // לוגים ספציפיים למערכת
    logFileOperation(operation, file, status) {
      this.log('info', `File ${operation}`, {
        file: file.name,
        status,
        size: file.size,
        type: file.type
      });
    }
  
    logAnalysis(file, results) {
      this.log('info', 'Sample analysis completed', {
        file: file.name,
        results
      });
    }
  
    logFLStudioEvent(event, data) {
      if (this.options.flStudioLogs) {
        this.log('info', `FL Studio Event: ${event}`, data);
      }
    }
  
    logError(error, context = null) {
      this.log('error', error.message, {
        stack: error.stack,
        context
      });
    }
  
    getSessionId() {
      if (!this.sessionId) {
        this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      }
      return this.sessionId;
    }
  
    async getLogStats() {
      try {
        const files = await this.getLogFiles();
        let totalSize = 0;
        let oldestLog = null;
        let newestLog = null;
        
        for (const file of files) {
          const stats = await this.getFileStats(file);
          totalSize += stats.size;
          
          if (!oldestLog || stats.mtime < oldestLog.mtime) {
            oldestLog = { file, mtime: stats.mtime };
          }
          if (!newestLog || stats.mtime > newestLog.mtime) {
            newestLog = { file, mtime: stats.mtime };
          }
        }
        
        return {
          totalSize,
          fileCount: files.length,
          oldestLog,
          newestLog
        };
      } catch (error) {
        console.error('Failed to get log stats:', error);
        return null;
      }
    }
  }
  
  export default Logger;