// audioAnalysis.js

class AudioAnalyzer {
    constructor() {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  
    async analyzeSample(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        return {
          duration: audioBuffer.duration,
          bpm: await this.detectBPM(audioBuffer),
          key: await this.detectKey(audioBuffer),
          loudness: this.calculateLoudness(audioBuffer),
          category: await this.detectCategory(audioBuffer),
          waveform: this.generateWaveform(audioBuffer)
        };
      } catch (error) {
        console.error('Analysis error:', error);
        throw error;
      }
    }
  
    async detectBPM(audioBuffer) {
      // אלגוריתם לזיהוי BPM
      const channelData = audioBuffer.getChannelData(0);
      
      // עיבוד אות בסיסי לזיהוי מקצב
      const peaks = this.findPeaks(channelData);
      const intervals = this.analyzeIntervals(peaks, audioBuffer.sampleRate);
      
      return this.calculateBPMFromIntervals(intervals);
    }
  
    findPeaks(channelData) {
      const peaks = [];
      const threshold = 0.8;
      
      for (let i = 1; i < channelData.length - 1; i++) {
        if (channelData[i] > threshold && 
            channelData[i] > channelData[i-1] && 
            channelData[i] > channelData[i+1]) {
          peaks.push(i);
        }
      }
      
      return peaks;
    }
  
    analyzeIntervals(peaks, sampleRate) {
      const intervals = [];
      
      for (let i = 1; i < peaks.length; i++) {
        const interval = (peaks[i] - peaks[i-1]) / sampleRate;
        intervals.push(interval);
      }
      
      return intervals;
    }
  
    calculateBPMFromIntervals(intervals) {
      const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      return Math.round(60 / averageInterval);
    }
  
    async detectKey(audioBuffer) {
      // אלגוריתם לזיהוי טונליות
      const channelData = audioBuffer.getChannelData(0);
      
      // ניתוח ספקטרלי בסיסי
      const frequencies = await this.performFFT(channelData);
      const dominantFreqs = this.findDominantFrequencies(frequencies);
      
      return this.determineKey(dominantFreqs);
    }
  
    async performFFT(channelData) {
      // Fast Fourier Transform implementation
      const fft = new FFT(channelData.length);
      return fft.forward(channelData);
    }
  
    findDominantFrequencies(frequencies) {
      const threshold = 0.5;
      const dominantFreqs = [];
      
      frequencies.forEach((magnitude, freq) => {
        if (magnitude > threshold) {
          dominantFreqs.push({ freq, magnitude });
        }
      });
      
      return dominantFreqs;
    }
  
    determineKey(dominantFreqs) {
      // מיפוי תדרים לטונים
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      // אלגוריתם לזיהוי הטון השולט
      return notes[0]; // לדוגמה
    }
  
    calculateLoudness(audioBuffer) {
      const channelData = audioBuffer.getChannelData(0);
      let sum = 0;
      
      for (let i = 0; i < channelData.length; i++) {
        sum += Math.abs(channelData[i]);
      }
      
      return sum / channelData.length;
    }
  
    async detectCategory(audioBuffer) {
      // אלגוריתם לזיהוי קטגוריה
      const features = this.extractFeatures(audioBuffer);
      return this.classifySound(features);
    }
  
    extractFeatures(audioBuffer) {
      // חילוץ מאפיינים מהסאמפל
      return {
        spectralCentroid: this.calculateSpectralCentroid(audioBuffer),
        zeroCrossingRate: this.calculateZeroCrossingRate(audioBuffer),
        rms: this.calculateRMS(audioBuffer)
      };
    }
  
    classifySound(features) {
      // סיווג לפי המאפיינים
      if (features.spectralCentroid > 0.8) return 'hihat';
      if (features.rms > 0.7) return 'kick';
      return 'synth';
    }
  
    generateWaveform(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const points = 100;
        const waveform = [];
        
        const blockSize = Math.floor(channelData.length / points);
        
        for (let i = 0; i < points; i++) {
          const start = blockSize * i;
          let sum = 0;
          
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j]);
          }
          
          waveform.push(sum / blockSize);
        }
        
        return waveform;
      }
    
      calculateSpectralCentroid(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const fft = new FFT(channelData.length);
        const spectrum = fft.forward(channelData);
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
          numerator += i * spectrum[i];
          denominator += spectrum[i];
        }
        
        return numerator / denominator;
      }
    
      calculateZeroCrossingRate(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let zeroCrossings = 0;
        
        for (let i = 1; i < channelData.length; i++) {
          if ((channelData[i] >= 0 && channelData[i - 1] < 0) || 
              (channelData[i] < 0 && channelData[i - 1] >= 0)) {
            zeroCrossings++;
          }
        }
        
        return zeroCrossings / channelData.length;
      }
    
      calculateRMS(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let sum = 0;
        
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        
        return Math.sqrt(sum / channelData.length);
      }
    }
    
    export default AudioAnalyzer;