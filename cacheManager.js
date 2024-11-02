// cacheManager.js

class CacheManager {
    constructor() {
      this.cacheName = 'sample-manager-cache-v1';
      this.maxCacheAge = 7 * 24 * 60 * 60 * 1000; // שבוע
      this.maxCacheSize = 500 * 1024 * 1024; // 500MB
    }
  
    async initialize() {
      try {
        const cache = await caches.open(this.cacheName);
        await this.cleanOldCache();
        return true;
      } catch (error) {
        console.error('Cache initialization failed:', error);
        return false;
      }
    }
  
    async cacheSample(sampleData) {
      try {
        const cache = await caches.open(this.cacheName);
        const response = new Response(sampleData.buffer);
        
        // שמירת מטאדאטה
        const metadata = {
          id: sampleData.id,
          timestamp: Date.now(),
          size: sampleData.buffer.byteLength,
          type: sampleData.type
        };
        
        // שמירת הקובץ והמטאדאטה
        await Promise.all([
          cache.put(`sample-${sampleData.id}`, response),
          cache.put(`metadata-${sampleData.id}`, new Response(JSON.stringify(metadata)))
        ]);
        
        return true;
      } catch (error) {
        console.error('Failed to cache sample:', error);
        return false;
      }
    }
  
    async getCachedSample(sampleId) {
      try {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(`sample-${sampleId}`);
        
        if (!response) return null;
        
        // עדכון זמן הגישה האחרון
        const metadata = await this.getSampleMetadata(sampleId);
        if (metadata) {
          metadata.lastAccessed = Date.now();
          await this.updateMetadata(sampleId, metadata);
        }
        
        return await response.arrayBuffer();
      } catch (error) {
        console.error('Failed to get cached sample:', error);
        return null;
      }
    }
  
    async getSampleMetadata(sampleId) {
      try {
        const cache = await caches.open(this.cacheName);
        const response = await cache.match(`metadata-${sampleId}`);
        
        if (!response) return null;
        
        return JSON.parse(await response.text());
      } catch (error) {
        console.error('Failed to get sample metadata:', error);
        return null;
      }
    }
  
    async updateMetadata(sampleId, metadata) {
      try {
        const cache = await caches.open(this.cacheName);
        await cache.put(
          `metadata-${sampleId}`,
          new Response(JSON.stringify(metadata))
        );
        return true;
      } catch (error) {
        console.error('Failed to update metadata:', error);
        return false;
      }
    }
  
    async cleanOldCache() {
      try {
        const cache = await caches.open(this.cacheName);
        const keys = await cache.keys();
        const now = Date.now();
        
        for (const request of keys) {
          if (request.url.includes('metadata-')) {
            const metadata = await this.getSampleMetadata(
              request.url.split('metadata-')[1]
            );
            
            if (metadata && (now - metadata.timestamp > this.maxCacheAge)) {
              // מחיקת הקובץ והמטאדאטה
              await Promise.all([
                cache.delete(request),
                cache.delete(`sample-${metadata.id}`)
              ]);
            }
          }
        }
        
        await this.enforceMaxCacheSize();
        return true;
      } catch (error) {
        console.error('Cache cleanup failed:', error);
        return false;
      }
    }
  
    async enforceMaxCacheSize() {
      try {
        const cache = await caches.open(this.cacheName);
        const keys = await cache.keys();
        let totalSize = 0;
        const samples = [];
        
        // חישוב גודל המטמון הנוכחי
        for (const request of keys) {
          if (request.url.includes('metadata-')) {
            const metadata = await this.getSampleMetadata(
              request.url.split('metadata-')[1]
            );
            if (metadata) {
              totalSize += metadata.size;
              samples.push(metadata);
            }
          }
        }
        
        // מחיקת הקבצים הישנים ביותר אם המטמון גדול מדי
        if (totalSize > this.maxCacheSize) {
          samples.sort((a, b) => a.lastAccessed - b.lastAccessed);
          
          while (totalSize > this.maxCacheSize && samples.length > 0) {
            const oldestSample = samples.shift();
            await Promise.all([
              cache.delete(`sample-${oldestSample.id}`),
              cache.delete(`metadata-${oldestSample.id}`)
            ]);
            totalSize -= oldestSample.size;
          }
        }
        
        return true;
      } catch (error) {
        console.error('Cache size enforcement failed:', error);
        return false;
      }
    }
  
    async clearCache() {
      try {
        await caches.delete(this.cacheName);
        await this.initialize();
        return true;
      } catch (error) {
        console.error('Failed to clear cache:', error);
        return false;
      }
    }
  
    async getCacheStats() {
      try {
        const cache = await caches.open(this.cacheName);
        const keys = await cache.keys();
        let totalSize = 0;
        let sampleCount = 0;
        
        for (const request of keys) {
          if (request.url.includes('metadata-')) {
            const metadata = await this.getSampleMetadata(
              request.url.split('metadata-')[1]
            );
            if (metadata) {
              totalSize += metadata.size;
              sampleCount++;
            }
          }
        }
        
        return {
          totalSize,
          sampleCount,
          maxSize: this.maxCacheSize,
          usage: (totalSize / this.maxCacheSize) * 100
        };
      } catch (error) {
        console.error('Failed to get cache stats:', error);
        return null;
      }
    }
  }
  
  export default CacheManager;