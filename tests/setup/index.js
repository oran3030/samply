// tests/index.test.js

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs').promises;
const path = require('path');
const { 
  AudioAnalyzer, 
  FileHandler, 
  FLStudioBridge,
  DatabaseManager,
  CacheManager,
  SecurityManager,
  EventManager,
  APIManager,
  ConfigManager 
} = require('../src');

describe('Sample Manager Full Test Suite', () => {
  // ===== בדיקות ניתוח אודיו =====
  describe('Audio Analysis Tests', () => {
    let analyzer;
    let testFiles;
    
    before(async () => {
      analyzer = new AudioAnalyzer();
      testFiles = {
        kick: await fs.readFile(path.join(__dirname, 'fixtures/kick.wav')),
        bass: await fs.readFile(path.join(__dirname, 'fixtures/bass.wav')),
        synth: await fs.readFile(path.join(__dirname, 'fixtures/synth.wav'))
      };
    });

    it('should detect BPM accurately', async () => {
      const files = [
        { file: testFiles.kick, expectedBPM: 120 },
        { file: testFiles.bass, expectedBPM: 128 },
        { file: testFiles.synth, expectedBPM: 140 }
      ];

      for (const { file, expectedBPM } of files) {
        const result = await analyzer.analyzeSample(file);
        expect(result.bpm).to.be.closeTo(expectedBPM, 0.5);
      }
    });

    it('should detect musical key correctly', async () => {
      const files = [
        { file: testFiles.kick, expectedKey: 'C' },
        { file: testFiles.bass, expectedKey: 'F' },
        { file: testFiles.synth, expectedKey: 'Am' }
      ];

      for (const { file, expectedKey } of files) {
        const result = await analyzer.analyzeSample(file);
        expect(result.key).to.equal(expectedKey);
      }
    });

    it('should generate accurate waveform data', async () => {
      const result = await analyzer.analyzeSample(testFiles.kick);
      expect(result.waveform).to.be.an('array');
      expect(result.waveform.length).to.equal(100); // 100 נקודות דגימה
      expect(Math.max(...result.waveform)).to.be.lessThanOrEqual(1);
    });

    it('should detect transients correctly', async () => {
      const result = await analyzer.analyzeSample(testFiles.kick);
      expect(result.transients).to.be.an('array');
      expect(result.transients[0]).to.be.closeTo(0, 0.01); // התחלת הדגימה
    });

    it('should calculate RMS levels', async () => {
      const result = await analyzer.analyzeSample(testFiles.kick);
      expect(result.rmsLevel).to.be.a('number');
      expect(result.rmsLevel).to.be.within(0, 1);
    });
  });

  // ===== בדיקות אינטגרציה עם FL Studio =====
  describe('FL Studio Integration Tests', () => {
    let bridge;
    let mockFL;

    beforeEach(() => {
      mockFL = {
        connect: sinon.stub().returns(true),
        getBPM: sinon.stub().returns(128),
        getKey: sinon.stub().returns('Am'),
        loadSample: sinon.stub().returns(true),
        createChannel: sinon.stub().returns(1),
        setChannelSettings: sinon.stub().returns(true)
      };

      bridge = new FLStudioBridge();
      bridge.fl = mockFL;
    });

    it('should establish connection with FL Studio', async () => {
      const result = await bridge.connect();
      expect(result).to.be.true;
      expect(mockFL.connect.calledOnce).to.be.true;
    });

    it('should sync project data bidirectionally', async () => {
      await bridge.connect();
      
      const data = await bridge.syncProjectData();
      expect(data).to.deep.equal({
        bpm: 128,
        key: 'Am'
      });

      // בדיקת סנכרון הפוך
      await bridge.updateProjectBPM(130);
      expect(mockFL.setProjectBPM.calledWith(130)).to.be.true;
    });

    it('should load samples to correct channels', async () => {
      const sample = {
        path: 'test.wav',
        name: 'Test Kick',
        channelSettings: {
          volume: 0.8,
          pan: 0
        }
      };

      const result = await bridge.loadSampleToChannel(sample);
      expect(result.channelId).to.equal(1);
      expect(mockFL.loadSample.calledWith(sample.path)).to.be.true;
      expect(mockFL.setChannelSettings.calledOnce).to.be.true;
    });

    it('should handle timebase synchronization', async () => {
      const sample = {
        path: 'test.wav',
        duration: 2, // 2 seconds
        bpm: 140
      };

      await bridge.loadSampleWithSync(sample);
      expect(mockFL.setTimebaseStretch.called).to.be.true;
    });
  });

  // ===== בדיקות מערכת קבצים =====
  describe('File System Tests', () => {
    let fileHandler;
    const testDir = path.join(__dirname, 'test-samples');

    beforeEach(async () => {
      fileHandler = new FileHandler();
      await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should organize files by category', async () => {
      const testFiles = [
        { name: 'kick.wav', type: 'drums' },
        { name: 'bass.wav', type: 'bass' },
        { name: 'pad.wav', type: 'synth' }
      ];

      const result = await fileHandler.organizeFiles(testFiles, testDir);
      
      for (const file of testFiles) {
        const categoryPath = path.join(testDir, file.type);
        const filePath = path.join(categoryPath, file.name);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists).to.be.true;
      }
    });

    it('should handle file name conflicts', async () => {
      const files = [
        { name: 'sample.wav', content: 'test1' },
        { name: 'sample.wav', content: 'test2' }
      ];

      await fileHandler.saveFiles(files, testDir);
      const dirContents = await fs.readdir(testDir);
      expect(dirContents).to.have.lengthOf(2);
      expect(dirContents).to.include('sample.wav');
      expect(dirContents).to.include('sample_1.wav');
    });

    it('should validate file types and sizes', async () => {
      const validFile = {
        name: 'test.wav',
        type: 'audio/wav',
        size: 1024 * 1024
      };

      const invalidFile = {
        name: 'test.exe',
        type: 'application/exe',
        size: 5 * 1024 * 1024 * 1024
      };

      expect(await fileHandler.validateFile(validFile)).to.be.true;
      expect(await fileHandler.validateFile(invalidFile)).to.be.false;
    });
  });

  // ===== בדיקות מסד נתונים =====
  describe('Database Tests', () => {
    let db;

    beforeEach(async () => {
      db = new DatabaseManager();
      await db.connect();
      await db.clearAll();
    });

    afterEach(async () => {
      await db.clearAll();
    });

    it('should perform CRUD operations', async () => {
      // Create
      const sampleData = {
        name: 'test.wav',
        category: 'drums',
        bpm: 120
      };
      
      const id = await db.addSample(sampleData);
      expect(id).to.be.a('string');

      // Read
      const retrieved = await db.getSample(id);
      expect(retrieved).to.deep.include(sampleData);

      // Update
      const updated = await db.updateSample(id, { bpm: 125 });
      expect(updated.bpm).to.equal(125);

      // Delete
      await db.deleteSample(id);
      const deleted = await db.getSample(id);
      expect(deleted).to.be.null;
    });

    it('should perform complex queries', async () => {
      const samples = [
        { name: 'kick1.wav', category: 'drums', bpm: 120, key: 'C' },
        { name: 'kick2.wav', category: 'drums', bpm: 128, key: 'C' },
        { name: 'bass1.wav', category: 'bass', bpm: 120, key: 'F' }
      ];

      for (const sample of samples) {
        await db.addSample(sample);
      }

      const results = await db.searchSamples({
        category: 'drums',
        bpm: [115, 125],
        key: 'C'
      });

      expect(results).to.have.lengthOf(1);
      expect(results[0].name).to.equal('kick1.wav');
    });

    it('should handle relationships and joins', async () => {
      const playlistId = await db.createPlaylist('Test Playlist');
      const sampleId = await db.addSample({ name: 'test.wav' });
      
      await db.addToPlaylist(playlistId, sampleId);
      const playlist = await db.getPlaylistWithSamples(playlistId);
      
      expect(playlist.samples).to.have.lengthOf(1);
      expect(playlist.samples[0].id).to.equal(sampleId);
    });
  });

  // ===== בדיקות מערכת מטמון =====
  describe('Cache System Tests', () => {
    let cache;

    beforeEach(async () => {
      cache = new CacheManager();
      await cache.initialize();
    });

    afterEach(async () => {
      await cache.clearCache();
    });

    it('should cache and retrieve data efficiently', async () => {
      const testData = { id: '123', buffer: Buffer.from('test data') };
      
      // מדידת זמן השמירה
      const saveStart = performance.now();
      await cache.cacheSample(testData);
      const saveTime = performance.now() - saveStart;
      
      // מדידת זמן השליפה
      const retrieveStart = performance.now();
      const retrieved = await cache.getCachedSample('123');
      const retrieveTime = performance.now() - retrieveStart;
      
      expect(retrieved).to.deep.equal(testData.buffer);
      expect(saveTime).to.be.below(100); // פחות מ-100ms
      expect(retrieveTime).to.be.below(50); // פחות מ-50ms
    });

    it('should handle concurrent operations', async () => {
      const operations = Array(100).fill().map((_, i) => ({
        id: `sample${i}`,
        data: Buffer.from(`test data ${i}`)
      }));

      // שמירה מקבילית
      await Promise.all(operations.map(op => 
        cache.cacheSample({ id: op.id, buffer: op.data })
      ));

      // שליפה מקבילית
      const results = await Promise.all(operations.map(op =>
        cache.getCachedSample(op.id)
      ));

      expect(results).to.have.lengthOf(operations.length);
      results.forEach((result, i) => {
        expect(result).to.deep.equal(operations[i].data);
      });
    });

    it('should enforce size limits', async () => {
      const maxSize = cache.maxCacheSize;
      const oversizedData = Buffer.alloc(maxSize + 1024);
      
      try {
        await cache.cacheSample({ id: 'large', buffer: oversizedData });
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).to.include('exceeds maximum cache size');
      }
    });
  });

  // ===== בדיקות אבטחה =====
  describe('Security Tests', () => {
    let security;

    beforeEach(() => {
      security = new SecurityManager();
    });

    it('should validate file paths', () => {
      const paths = {
        valid: [
          '/samples/kick.wav',
          './drum/snare.wav',
          'C:\\samples\\hihat.wav'
        ],
        invalid: [
          '../outside/file.wav',
          '..\\windows\\system32\\file.dll',
          '/etc/passwd',
          'C:\\Windows\\System32\\cmd.exe'
        ]
      };

      paths.valid.forEach(path => {
        expect(() => security.validatePath(path)).to.not.throw();
      });

      paths.invalid.forEach(path => {
        expect(() => security.validatePath(path)).to.throw();
      });
    });

    it('should sanitize user input', () => {
      const inputs = {
        'normal-file.wav': 'normal-file.wav',
        '<script>alert(1)</script>': 'alert1',
        '../../../../../etc/passwd': 'etcpasswd',
        'file; rm -rf /': 'file'
      };

      Object.entries(inputs).forEach(([input, expected]) => {
        expect(security.sanitizeInput(input)).to.equal(expected);
      });
    });

    it('should validate audio file signatures', async () => {
      const signatures = {
        wav: Buffer.from([0x52, 0x49, 0x46, 0x46]),
        mp3: Buffer.from([0x49, 0x44, 0x33]),
        ogg: Buffer.from([0x4F, 0x67, 0x67, 0x53])
      };

      for (const [format, signature] of Object.entries(signatures)) {
        expect(security.validateFileSignature(signature, format)).to.be.true;
      }
    });
  });

  // ===== בדיקות ביצועים =====
  describe('Performance Tests', () => {
    it('should handle large batch operations', async () => {
      const batchSize = 1000;
      const samples = Array(batchSize).fill().map((_, i) => ({
        name: `sample${i}.wav`,
        category: i % 2 === 0 ? 'drums' : 'bass',
        bpm: 120 + (i % 40)
      }));

      const startTime = performance.now();
      
      await Promise.all([
        // הוספה למסד נתונים
        samples.map(sample => db.addSample(sample)),
        
        // המשך מהקוד הקודם
        samples.map(sample => analyzer.analyzeSample(sample)),
        
        // שמירה במטמון
        samples.map(sample => cache.cacheSample(sample))
      ]);

      const endTime = performance.now();
      const timePerOperation = (endTime - startTime) / batchSize;
      
      expect(timePerOperation).to.be.below(50); // פחות מ-50ms לפעולה
    });

    it('should maintain performance under load', async () => {
      const concurrentUsers = 50;
      const operationsPerUser = 20;
      
      const userOperations = Array(concurrentUsers).fill().map(() => {
        return Array(operationsPerUser).fill().map(() => ({
          type: Math.random() > 0.5 ? 'read' : 'write',
          data: {
            name: `test${Math.random()}.wav`,
            category: 'drums',
            bpm: 120 + Math.floor(Math.random() * 40)
          }
        }));
      });

      const startTime = performance.now();

      await Promise.all(userOperations.map(async (operations) => {
        for (const op of operations) {
          if (op.type === 'write') {
            await db.addSample(op.data);
          } else {
            await db.searchSamples({ category: op.data.category });
          }
        }
      }));

      const endTime = performance.now();
      const totalOperations = concurrentUsers * operationsPerUser;
      const avgResponseTime = (endTime - startTime) / totalOperations;

      expect(avgResponseTime).to.be.below(100); // פחות מ-100ms לפעולה
    });

    it('should handle real-time audio analysis efficiently', async () => {
      const sampleLength = 44100 * 2; // 2 שניות של אודיו
      const audioBuffer = new Float32Array(sampleLength);
      
      // יצירת גל סינוס לבדיקה
      for (let i = 0; i < sampleLength; i++) {
        audioBuffer[i] = Math.sin(2 * Math.PI * 440 * i / 44100);
      }

      const startTime = performance.now();
      const analysis = await analyzer.analyzeRealTime(audioBuffer);
      const analysisTime = performance.now() - startTime;

      expect(analysisTime).to.be.below(100); // פחות מ-100ms לניתוח
      expect(analysis).to.have.property('pitch');
      expect(analysis).to.have.property('rms');
    });
  });

  // ===== בדיקות אינטגרציה מלאות =====
  describe('Full Integration Tests', () => {
    let system;
    
    before(async () => {
      system = {
        analyzer: new AudioAnalyzer(),
        fileHandler: new FileHandler(),
        db: new DatabaseManager(),
        cache: new CacheManager(),
        security: new SecurityManager(),
        events: new EventManager(),
        flBridge: new FLStudioBridge(),
        api: new APIManager(),
        config: new ConfigManager()
      };

      await system.db.connect();
      await system.cache.initialize();
      await system.flBridge.connect();
    });

    after(async () => {
      await system.db.disconnect();
      await system.cache.clearCache();
      await system.flBridge.disconnect();
    });

    it('should handle complete sample processing workflow', async () => {
      const events = [];
      system.events.on('*', (event) => events.push(event));

      // 1. העלאת קובץ
      const testFile = {
        name: 'test-kick.wav',
        type: 'audio/wav',
        size: 1024 * 1024,
        buffer: await fs.readFile(path.join(__dirname, 'fixtures/kick.wav'))
      };

      // 2. בדיקת אבטחה
      const isValid = await system.security.validateFile(testFile);
      expect(isValid).to.be.true;

      // 3. ניתוח הקובץ
      const analysis = await system.analyzer.analyzeSample(testFile.buffer);
      expect(analysis).to.have.property('bpm');
      expect(analysis).to.have.property('key');

      // 4. שמירה במסד הנתונים
      const sampleId = await system.db.addSample({
        ...testFile,
        ...analysis
      });
      expect(sampleId).to.be.a('string');

      // 5. שמירה במטמון
      await system.cache.cacheSample({
        id: sampleId,
        buffer: testFile.buffer
      });

      // 6. ארגון בתיקיות
      const filePath = await system.fileHandler.organizeSample({
        ...testFile,
        category: analysis.category
      });
      expect(filePath).to.be.a('string');

      // 7. טעינה ל-FL Studio
      const loaded = await system.flBridge.loadSample({
        path: filePath,
        bpm: analysis.bpm,
        key: analysis.key
      });
      expect(loaded).to.be.true;

      // בדיקת אירועים
      expect(events).to.include.members([
        'fileUploadStart',
        'fileAnalysisComplete',
        'fileSaved',
        'sampleCached',
        'sampleOrganized',
        'flStudioSampleLoaded'
      ]);
    });

    it('should sync with FL Studio in real-time', async () => {
      const projectChanges = [];
      system.events.onFLStudio('projectChanged', (change) => 
        projectChanges.push(change)
      );

      // 1. שינוי BPM
      await system.flBridge.updateProjectBPM(128);
      
      // 2. שינוי טונליות
      await system.flBridge.updateProjectKey('Am');
      
      // 3. טעינת סאמפל
      const sample = await system.db.getSample('test-sample-id');
      await system.flBridge.loadSample(sample);

      // אימות השינויים
      expect(projectChanges).to.have.lengthOf(3);
      expect(projectChanges[0]).to.deep.include({ type: 'bpm', value: 128 });
      expect(projectChanges[1]).to.deep.include({ type: 'key', value: 'Am' });
      expect(projectChanges[2]).to.deep.include({ type: 'sampleLoaded' });
    });

    it('should handle error conditions gracefully', async () => {
      const errors = [];
      system.events.on('error', (error) => errors.push(error));

      // 1. קובץ לא תקין
      const invalidFile = {
        name: 'invalid.exe',
        type: 'application/exe'
      };
      
      await system.api.handleFileUpload(invalidFile)
        .catch(error => errors.push(error));

      // 2. נתיב לא תקין
      await system.fileHandler.readFile('../invalid/path')
        .catch(error => errors.push(error));

      // 3. חיבור FL Studio נכשל
      system.flBridge.fl = null;
      await system.flBridge.connect()
        .catch(error => errors.push(error));

      expect(errors).to.have.lengthOf(3);
      errors.forEach(error => {
        expect(error).to.be.an('error');
        expect(error.message).to.be.a('string');
      });
    });

    it('should maintain data consistency', async () => {
      // 1. הוספת סאמפל
      const sampleData = {
        name: 'test.wav',
        category: 'drums',
        bpm: 120
      };

      const sampleId = await system.db.addSample(sampleData);

      // 2. בדיקת עקביות במסד הנתונים
      const dbSample = await system.db.getSample(sampleId);
      expect(dbSample).to.deep.include(sampleData);

      // 3. בדיקת עקביות במטמון
      const cachedSample = await system.cache.getCachedSample(sampleId);
      expect(cachedSample).to.exist;

      // 4. בדיקת עקביות בתיקיות
      const filePath = system.fileHandler.getSamplePath(sampleId);
      const fileExists = await fs.access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).to.be.true;

      // 5. מחיקת הסאמפל
      await system.api.deleteSample(sampleId);

      // 6. וידוא מחיקה מכל המקומות
      expect(await system.db.getSample(sampleId)).to.be.null;
      expect(await system.cache.getCachedSample(sampleId)).to.be.null;
      expect(await fs.access(filePath).catch(() => false)).to.be.false;
    });
  });

  // ===== בדיקות ממשק משתמש =====
  describe('UI Integration Tests', () => {
    let wrapper;
    
    beforeEach(() => {
      wrapper = mount(<SampleManager />);
    });

    it('should render main components', () => {
      expect(wrapper.find('Uploader')).to.have.lengthOf(1);
      expect(wrapper.find('Library')).to.have.lengthOf(1);
      expect(wrapper.find('WaveformDisplay')).to.have.lengthOf(1);
      expect(wrapper.find('Controls')).to.have.lengthOf(1);
    });

    it('should handle file drag and drop', async () => {
      const file = new File(['test'], 'test.wav', { type: 'audio/wav' });
      const dropEvent = createDropEvent([file]);

      await act(async () => {
        wrapper.find('Uploader').simulate('drop', dropEvent);
      });

      expect(wrapper.find('ProgressBar')).to.exist;
      await waitFor(() => {
        expect(wrapper.find('Library')).to.have.lengthOf(1);
      });
    });

    it('should update waveform display', async () => {
      const sample = {
        id: 'test',
        name: 'test.wav',
        waveform: Array(100).fill().map(() => Math.random())
      };

      await act(async () => {
        wrapper.find('Library').prop('onSampleSelect')(sample);
      });

      const waveform = wrapper.find('WaveformDisplay');
      expect(waveform.prop('data')).to.deep.equal(sample.waveform);
    });
  });
});
       