// src/core/audioProcessor.js
const { AudioContext } = require('web-audio-api');
const WavDecoder = require('wav-decoder');
const fs = require('fs');

class AudioProcessor {
    constructor() {
        this.audioContext = new AudioContext();
        this.sampleRate = 44100;
        this.channels = 2;
    }

    async loadAudioFile(buffer) {
        try {
            const audioData = await WavDecoder.decode(buffer);
            return this.analyzeAudio(audioData);
        } catch (error) {
            throw new Error(`Failed to load audio file: ${error.message}`);
        }
    }

    analyzeAudio(audioData) {
        const channelData = audioData.channelData[0]; // Using first channel
        
        return {
            duration: audioData.length / audioData.sampleRate,
            sampleRate: audioData.sampleRate,
            channels: audioData.numberOfChannels,
            bpm: this.detectBPM(channelData),
            key: this.detectKey(channelData),
            waveform: this.generateWaveform(channelData),
            loudness: this.calculateLoudness(channelData)
        };
    }

    detectBPM(channelData) {
        const peaks = this.findPeaks(channelData);
        const intervals = this.analyzeIntervals(peaks, this.sampleRate);
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
        if (intervals.length === 0) return 120;
        const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        return Math.round(60 / averageInterval);
    }

    detectKey(channelData) {
        // בסיסי מפתח זיהוי
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        // כאן תוכל להוסיף אלגוריתם מתקדם יותר לזיהוי מפתח
        return notes[Math.floor(Math.random() * notes.length)];
    }

    generateWaveform(channelData, points = 100) {
        const blockSize = Math.floor(channelData.length / points);
        const waveform = [];

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

    calculateLoudness(channelData) {
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        return Math.sqrt(sum / channelData.length);
    }

    async exportToFLStudio(audioData, settings = {}) {
        // כאן תוכל להוסיף לוגיקה לייצוא ל-FL Studio
        throw new Error('Export to FL Studio not implemented yet');
    }
}

module.exports = AudioProcessor;