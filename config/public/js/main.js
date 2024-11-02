document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const results = document.getElementById('results');
    const waveformCanvas = document.getElementById('waveform');

    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#666';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    });

    async function processFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        audioData: Array.from(new Uint8Array(e.target.result))
                    })
                });

                const data = await response.json();
                displayResults(data);
                drawWaveform(data.waveform);
            } catch (error) {
                console.error('Error:', error);
                results.innerHTML = `<p style="color: red">Error: ${error.message}</p>`;
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function displayResults(data) {
        results.innerHTML = `
            <h3>Analysis Results:</h3>
            <p>BPM: ${data.bpm}</p>
            <p>Key: ${data.key}</p>
            <p>Duration: ${data.duration.toFixed(2)}s</p>
            <p>Loudness: ${data.loudness.toFixed(2)}</p>
        `;
    }

    function drawWaveform(waveformData) {
        const ctx = waveformCanvas.getContext('2d');
        const width = waveformCanvas.width;
        const height = waveformCanvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#2196F3';
        ctx.beginPath();
        
        const stepSize = width / waveformData.length;
        for (let i = 0; i < waveformData.length; i++) {
            const x = i * stepSize;
            const y = (1 - waveformData[i]) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
});s