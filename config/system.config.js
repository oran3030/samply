module.exports = {
    audio: {
        sampleRate: 44100,
        bitDepth: 24,
        channels: 2
    },
    flStudio: {
        autoSync: true,
        defaultBPM: 128,
        defaultKey: 'C'
    },
    storage: {
        maxCacheSize: '500MB',
        tempDir: './temp',
        backupInterval: '24h'
    }
};