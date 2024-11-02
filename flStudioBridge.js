// flStudioBridge.js

class FLStudioBridge {
    constructor() {
      this.isConnected = false;
      this.projectBPM = 0;
      this.projectKey = '';
      this.samplePath = '';
    }
  
    connect() {
      try {
        // התחברות ל-FL Studio דרך ה-DLL
        this.isConnected = true;
        this.syncProjectData();
        return true;
      } catch (error) {
        console.error('FL Studio connection error:', error);
        return false;
      }
    }
  
    syncProjectData() {
      if (!this.isConnected) return false;
      
      try {
        // קבלת מידע מהפרויקט הנוכחי
        this.projectBPM = this.getProjectBPM();
        this.projectKey = this.getProjectKey();
        return true;
      } catch (error) {
        console.error('Sync error:', error);
        return false;
      }
    }
  
    // קבלת ה-BPM מהפרויקט
    getProjectBPM() {
      return 128; // לדוגמה
    }
  
    // קבלת הטונליות מהפרויקט
    getProjectKey() {
      return 'C'; // לדוגמה
    }
  
    // העברת סאמפל ל-FL Studio
    sendSampleToFL(samplePath) {
      if (!this.isConnected) return false;
      
      try {
        // שליחת הסאמפל לפרויקט
        console.log(`Sending sample: ${samplePath}`);
        return true;
      } catch (error) {
        console.error('Sample transfer error:', error);
        return false;
      }
    }
  
    // יצירת ערוץ חדש עם הסאמפל
    createChannelWithSample(samplePath, channelName) {
      if (!this.isConnected) return false;
      
      try {
        // יצירת ערוץ חדש
        console.log(`Creating channel: ${channelName} with sample: ${samplePath}`);
        return true;
      } catch (error) {
        console.error('Channel creation error:', error);
        return false;
      }
    }
  
    // סנכרון טונליות הסאמפל
    syncSampleKey(samplePath, originalKey) {
      if (!this.isConnected) return false;
      
      try {
        // התאמת טונליות
        const semitones = this.calculateKeyDifference(originalKey, this.projectKey);
        console.log(`Adjusting key by ${semitones} semitones`);
        return true;
      } catch (error) {
        console.error('Key sync error:', error);
        return false;
      }
    }
  
    // חישוב הפרש הטונים
    calculateKeyDifference(key1, key2) {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const index1 = notes.indexOf(key1);
      const index2 = notes.indexOf(key2);
      return index2 - index1;
    }
  
    // סנכרון BPM של הסאמפל
    syncSampleBPM(samplePath, originalBPM) {
      if (!this.isConnected) return false;
      
      try {
        // התאמת מהירות
        const ratio = this.projectBPM / originalBPM;
        console.log(`Adjusting BPM ratio: ${ratio}`);
        return true;
      } catch (error) {
        console.error('BPM sync error:', error);
        return false;
      }
    }
  
    disconnect() {
      if (!this.isConnected) return;
      
      try {
        // ניתוק מ-FL Studio
        this.isConnected = false;
        return true;
      } catch (error) {
        console.error('Disconnect error:', error);
        return false;
      }
    }
  }
  
  export default FLStudioBridge;