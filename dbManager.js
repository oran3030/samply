// dbManager.js

class DatabaseManager {
    constructor() {
      this.dbName = 'sampleManagerDB';
      this.version = 1;
      this.db = null;
    }
  
    async connect() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);
        
        request.onerror = () => {
          reject(new Error('Failed to connect to database'));
        };
        
        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // יצירת טבלאות
          if (!db.objectStoreNames.contains('samples')) {
            const samplesStore = db.createObjectStore('samples', { keyPath: 'id', autoIncrement: true });
            samplesStore.createIndex('category', 'category', { unique: false });
            samplesStore.createIndex('bpm', 'bpm', { unique: false });
            samplesStore.createIndex('key', 'key', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('playlists')) {
            const playlistsStore = db.createObjectStore('playlists', { keyPath: 'id', autoIncrement: true });
            playlistsStore.createIndex('name', 'name', { unique: true });
          }
          
          if (!db.objectStoreNames.contains('tags')) {
            db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
          }
        };
      });
    }
  
    async addSample(sampleData) {
      return this.performTransaction('samples', 'readwrite', store => {
        return store.add(sampleData);
      });
    }
  
    async getSample(id) {
      return this.performTransaction('samples', 'readonly', store => {
        return store.get(id);
      });
    }
  
    async updateSample(id, updates) {
      return this.performTransaction('samples', 'readwrite', store => {
        return store.put({ ...await this.getSample(id), ...updates });
      });
    }
  
    async deleteSample(id) {
      return this.performTransaction('samples', 'readwrite', store => {
        return store.delete(id);
      });
    }
  
    async searchSamples(criteria) {
      return this.performTransaction('samples', 'readonly', store => {
        const samples = [];
        const cursor = store.openCursor();
        
        return new Promise((resolve, reject) => {
          cursor.onsuccess = (event) => {
            const cursor = event.target.result;
            
            if (cursor) {
              if (this.matchesCriteria(cursor.value, criteria)) {
                samples.push(cursor.value);
              }
              cursor.continue();
            } else {
              resolve(samples);
            }
          };
          
          cursor.onerror = () => reject(new Error('Search failed'));
        });
      });
    }
  
    matchesCriteria(sample, criteria) {
      for (const [key, value] of Object.entries(criteria)) {
        if (Array.isArray(value)) {
          // טווח ערכים (למשל BPM)
          if (sample[key] < value[0] || sample[key] > value[1]) {
            return false;
          }
        } else if (typeof value === 'string' && value.includes('*')) {
          // חיפוש טקסט חלקי
          const regex = new RegExp(value.replace('*', '.*'), 'i');
          if (!regex.test(sample[key])) {
            return false;
          }
        } else if (sample[key] !== value) {
          return false;
        }
      }
      return true;
    }
  
    async createPlaylist(name, samples = []) {
      return this.performTransaction('playlists', 'readwrite', store => {
        return store.add({ name, samples });
      });
    }
  
    async addToPlaylist(playlistId, sampleId) {
      const playlist = await this.getPlaylist(playlistId);
      if (!playlist) throw new Error('Playlist not found');
      
      playlist.samples.push(sampleId);
      
      return this.performTransaction('playlists', 'readwrite', store => {
        return store.put(playlist);
      });
    }
  
    async addTag(sampleId, tag) {
      return this.performTransaction('tags', 'readwrite', store => {
        return store.add({ sampleId, tag });
      });
    }
  
    async performTransaction(storeName, mode, operation) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Transaction failed'));
        
        resolve(operation(store));
      });
    }
  
    async backup() {
      const backup = {
        samples: await this.getAllSamples(),
        playlists: await this.getAllPlaylists(),
        tags: await this.getAllTags()
      };
      
      return JSON.stringify(backup);
    }
  
    async restore(backupData) {
      const data = JSON.parse(backupData);
      
      await this.clearAll();
      
      for (const sample of data.samples) {
        await this.addSample(sample);
      }
      
      for (const playlist of data.playlists) {
        await this.createPlaylist(playlist.name, playlist.samples);
      }
      
      for (const tag of data.tags) {
        await this.addTag(tag.sampleId, tag.tag);
      }
    }
  
    async clearAll() {
      const stores = ['samples', 'playlists', 'tags'];
      
      for (const store of stores) {
        await this.performTransaction(store, 'readwrite', store => {
          return store.clear();
        });
      }
    }
  }
  
  export default DatabaseManager;