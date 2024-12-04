const startStopBtn = document.getElementById("startStopBtn");
const downloadBtn = document.createElement("a"); // Temporary link for downloads
const audioPlayback = document.getElementById("audioPlayback");
const audioUploadForm = document.getElementById("audio-upload-form");
const audioFileInput = document.getElementById("audioFile");
const processBtn = document.getElementById("processBtn");
const videoPlayer = document.getElementById("videoPlayer");
const videoSource = document.getElementById("videoSource");

let mediaRecorder;
let audioChunks = [];
let audioBlob;
let audioFileName = "";

// Initialize audio recording
async function initRecorder() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            // Copy the audio data to ensure no reference issues
            audioChunks.push(event.data.slice(0)); // Clone the chunk for safety
        };

        mediaRecorder.onstop = async () => {
            // Combine audio chunks into a Blob
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Default MediaRecorder type

            // Convert to WAV (Optional: Use a library or custom WAV encoding)
            const wavBlob = await convertToWav(audioBlob);

            // Generate a unique filename for the recording
            const timestamp = Date.now();
            audioFileName = `recording_${timestamp}.wav`;

            // Create an audio URL for playback and download
            const audioUrl = URL.createObjectURL(wavBlob);
            audioPlayback.src = audioUrl;

            downloadBtn.href = audioUrl;
            downloadBtn.download = audioFileName;
            downloadBtn.textContent = "Download Recording";
            document.body.appendChild(downloadBtn); // Add the download button to the body

            // Set audioBlob to the WAV blob for consistent upload
            audioBlob = wavBlob; // Ensure audioBlob is the same as the downloaded audio
        };
    } catch (error) {
        console.error("Error initializing recorder:", error);
        alert("An error occurred while accessing your microphone.");
    }
}

// Start or stop recording
startStopBtn.addEventListener("click", async () => {
    if (!mediaRecorder) {
        await initRecorder();
    }

    if (mediaRecorder.state === "inactive") {
        audioChunks = []; // Clear previous recordings
        mediaRecorder.start();
        startStopBtn.textContent = "Stop Recording";
    } else {
        mediaRecorder.stop();
        startStopBtn.textContent = "Start Recording";
    }
});

// Function to convert audioBlob to WAV
async function convertToWav(audioBlob) {
    // Decode audio data into PCM
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Encode PCM data into a WAV file
    const wavBlob = encodeWav(audioBuffer);
    return wavBlob;
}

// WAV Encoding Logic
function encodeWav(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;
    const data = [];

    // Interleave audio channels
    for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i])); // Clamp values
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF; // Scale to 16-bit
            data.push(intSample & 0xFF, (intSample >> 8) & 0xFF);
        }
    }

    const byteRate = (sampleRate * bitsPerSample * numberOfChannels) / 8;
    const blockAlign = (bitsPerSample * numberOfChannels) / 8;

    // WAV Header
    const header = [
        ...stringToBytes("RIFF"),
        ...intToBytes(36 + data.length, 4),
        ...stringToBytes("WAVE"),
        ...stringToBytes("fmt "),
        ...intToBytes(16, 4),
        ...intToBytes(format, 2),
        ...intToBytes(numberOfChannels, 2),
        ...intToBytes(sampleRate, 4),
        ...intToBytes(byteRate, 4),
        ...intToBytes(blockAlign, 2),
        ...intToBytes(bitsPerSample, 2),
        ...stringToBytes("data"),
        ...intToBytes(data.length, 4),
    ];

    return new Blob([new Uint8Array(header.concat(data))], { type: "audio/wav" });
}

// Utility Functions
function stringToBytes(string) {
    return string.split("").map(char => char.charCodeAt(0));
}

function intToBytes(int, length) {
    const bytes = [];
    for (let i = 0; i < length; i++) {
        bytes.push((int >> (8 * i)) & 0xFF);
    }
    return bytes;
}

// Handle audio file upload
audioUploadForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent form submission

    const file = audioFileInput.files[0];
    if (file) {
        const fileType = file.type; // Check the file type (MIME type)

        // Ensure the file is a valid WAV file
        if (fileType !== 'audio/wav') {
            alert('Please upload a valid WAV audio file.');
            return;
        }

        const audioUrl = URL.createObjectURL(file);
        audioPlayback.src = audioUrl; // Play uploaded audio
        audioBlob = file; // Save the uploaded file as a blob
        audioFileName = file.name; // Use the uploaded file's original name
    } else {
        alert('No file selected. Please choose a WAV audio file to upload.'); // Added alert for no file selected
    }
});

// Process the audio (recorded or uploaded)
processBtn.addEventListener("click", async () => {
    if (!audioBlob) {
        alert("Please record or upload an audio file first.");
        return;
    }

    const audioType = audioBlob.type;
    console.log("Audio Blob Type:", audioType); // Debugging line to log the audio type

    const formData = new FormData();
    formData.append("audio", audioBlob, audioFileName);  // Use the actual audio file name

    const response = await fetch("http://127.0.0.1:5000/upload-audio", {
        method: "POST",
        body: formData,
    });

    const data = await response.json();
    if (response.ok) {
        const videoUrl = data.video_url;
        console.log("Video URL received:", videoUrl);

        if (videoUrl) {
            videoSource.src = videoUrl;
            videoPlayer.style.display = "block"; // Show the video player
            videoPlayer.load(); // Reload video with the new source
        } else {
            alert("Video URL is missing.");
        }
    } else {
        alert(`Error: ${data.error || 'Unknown error occurred.'}`); // Improved error handling
    }
});


