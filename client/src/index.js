// src/index.js
const express = require('express');
const path = require('path');
const AudioProcessor = require('./core/audioProcessor');

const app = express();
const port = process.env.PORT || 3000;

// מעבד האודיו
const audioProcessor = new AudioProcessor();

// הגדרות Express
app.use(express.json());
app.use(express.static('public'));

// נתיבים
app.post('/api/analyze', async (req, res) => {
    try {
        const result = await audioProcessor.loadAudioFile(req.body.audioData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'running' });
});

// הפעלת השרת
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;