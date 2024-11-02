// apiManager.js

class APIManager {
    constructor(eventManager, flBridge) {
      this.eventManager = eventManager;
      this.flBridge = flBridge;
      this.endpoints = new Map();
      this.setupEndpoints();
    }
  
    setupEndpoints() {
      // נקודות קצה לניהול קבצים
      this.addEndpoint('uploadFiles', this.handleFileUpload.bind(this));
      this.addEndpoint('analyzeSample', this.handleSampleAnalysis.bind(this));
      this.addEndpoint('organizeSamples', this.handleSampleOrganization.bind(this));
      
      // נקודות קצה ל-FL Studio
      this.addEndpoint('connectFLStudio', this.handleFLStudioConnection.bind(this));
      this.addEndpoint('loadToFLStudio', this.handleFLStudioLoad.bind(this));
      this.addEndpoint('syncWithFLStudio', this.handleFLStudioSync.bind(this));
    }
  
    addEndpoint(name, handler) {
      this.endpoints.set(name, handler);
    }
  
    async handleRequest(endpoint, data) {
      const handler = this.endpoints.get(endpoint);
      if (!handler) {
        throw new Error(`Endpoint ${endpoint} not found`);
      }
      
      try {
        return await handler(data);
      } catch (error) {
        this.eventManager.emit(EventManager.Events.SYSTEM_ERROR, error);
        throw error;
      }
    }
  
    async handleFileUpload(files) {
      this.eventManager.emit(EventManager.Events.FILE_UPLOAD_START, { 
        fileCount: files.length 
      });
      
      try {
        // העלאת הקבצים
        for (const file of files) {
          await this.processFile(file);
        }
        
        this.eventManager.emit(EventManager.Events.FILE_UPLOAD_COMPLETE);
        return { success: true };
      } catch (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  
    async processFile(file) {
      // עיבוד הקובץ
      const analysis = await this.handleSampleAnalysis(file);
      await this.saveToDatabase(file, analysis);
      return analysis;
    }
  
    async handleSampleAnalysis(file) {
      this.eventManager.emit(EventManager.Events.FILE_ANALYSIS_START, { 
        fileName: file.name 
      });
      
      try {
        // ניתוח הסאמפל
        const analyzer = new AudioAnalyzer();
        const analysis = await analyzer.analyzeSample(file);
        
        this.eventManager.emit(EventManager.Events.FILE_ANALYSIS_COMPLETE, {
          fileName: file.name,
          analysis
        });
        
        return analysis;
      } catch (error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }
    }
  
    async handleSampleOrganization(samples) {
      try {
        const organizer = new FileHandler();
        const organized = await organizer.organizeFiles(samples);
        
        this.eventManager.emit(EventManager.Events.FILE_ORGANIZATION_COMPLETE, {
          organizationMap: organized
        });
        
        return organized;
      } catch (error) {
        throw new Error(`Organization failed: ${error.message}`);
      }
    }
  
    async handleFLStudioConnection() {
      try {
        const connected = await this.flBridge.connect();
        
        if (connected) {
          this.eventManager.emit(EventManager.Events.FL_STUDIO_CONNECTED);
          return { success: true };
        } else {
          throw new Error('Connection failed');
        }
      } catch (error) {
        throw new Error(`FL Studio connection failed: ${error.message}`);
      }
    }
  
    async handleFLStudioLoad(sample) {
      try {
        const loaded = await this.flBridge.loadSample(sample);
        
        if (loaded) {
          this.eventManager.emit(EventManager.Events.FL_STUDIO_SAMPLE_LOADED, {
            sampleName: sample.name
          });
          return { success: true };
        } else {
          throw new Error('Load failed');
        }
      } catch (error) {
        throw new Error(`Sample load failed: ${error.message}`);
      }
    }
  
    async handleFLStudioSync() {
      try {
        const projectData = await this.flBridge.syncProjectData();
        
        this.eventManager.emit(EventManager.Events.FL_STUDIO_BPM_CHANGED, {
          bpm: projectData.bpm
        });
        
        this.eventManager.emit(EventManager.Events.FL_STUDIO_KEY_CHANGED, {
          key: projectData.key
        });
        
        return projectData;
      } catch (error) {
        throw new Error(`Sync failed: ${error.message}`);
      }
    }
  
    async saveToDatabase(file, analysis) {
      try {
        const db = await this.getDatabaseConnection();
        await db.samples.add({
          file,
          analysis,
          timestamp: Date.now()
        });
      } catch (error) {
        throw new Error(`Database save failed: ${error.message}`);
      }
    }
  }
  
  export default APIManager;