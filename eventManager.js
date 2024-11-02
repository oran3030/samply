// eventManager.js

class EventManager {
    constructor() {
      this.events = new Map();
      this.flStudioEvents = new Map();
    }
  
    // רישום לאירועי מערכת
    on(eventName, callback) {
      if (!this.events.has(eventName)) {
        this.events.set(eventName, new Set());
      }
      this.events.get(eventName).add(callback);
    }
  
    // הסרת רישום לאירוע
    off(eventName, callback) {
      if (this.events.has(eventName)) {
        this.events.get(eventName).delete(callback);
      }
    }
  
    // שליחת אירוע
    emit(eventName, data) {
      if (this.events.has(eventName)) {
        this.events.get(eventName).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event ${eventName}:`, error);
          }
        });
      }
    }
  
    // רישום לאירועי FL Studio
    onFLStudio(eventName, callback) {
      if (!this.flStudioEvents.has(eventName)) {
        this.flStudioEvents.set(eventName, new Set());
      }
      this.flStudioEvents.get(eventName).add(callback);
    }
  
    // קבלת אירוע מ-FL Studio
    handleFLStudioEvent(eventName, data) {
      if (this.flStudioEvents.has(eventName)) {
        this.flStudioEvents.get(eventName).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in FL Studio event ${eventName}:`, error);
          }
        });
      }
    }
  
    // אירועי מערכת נפוצים
    static Events = {
      // אירועי קבצים
      FILE_UPLOAD_START: 'fileUploadStart',
      FILE_UPLOAD_PROGRESS: 'fileUploadProgress',
      FILE_UPLOAD_COMPLETE: 'fileUploadComplete',
      FILE_ANALYSIS_START: 'fileAnalysisStart',
      FILE_ANALYSIS_COMPLETE: 'fileAnalysisComplete',
      FILE_ORGANIZATION_COMPLETE: 'fileOrganizationComplete',
      
      // אירועי FL Studio
      FL_STUDIO_CONNECTED: 'flStudioConnected',
      FL_STUDIO_DISCONNECTED: 'flStudioDisconnected',
      FL_STUDIO_BPM_CHANGED: 'flStudioBpmChanged',
      FL_STUDIO_KEY_CHANGED: 'flStudioKeyChanged',
      FL_STUDIO_SAMPLE_LOADED: 'flStudioSampleLoaded',
      
      // אירועי ספרייה
      LIBRARY_REFRESH: 'libraryRefresh',
      LIBRARY_SEARCH: 'librarySearch',
      LIBRARY_FILTER: 'libraryFilter',
      
      // אירועי נגינה
      SAMPLE_PLAY_START: 'samplePlayStart',
      SAMPLE_PLAY_STOP: 'samplePlayStop',
      SAMPLE_LOOP: 'sampleLoop',
      
      // אירועי מערכת
      SYSTEM_ERROR: 'systemError',
      SYSTEM_WARNING: 'systemWarning',
      SYSTEM_INFO: 'systemInfo'
    };
  }
  
  export default EventManager;