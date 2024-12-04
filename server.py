import os
import subprocess
from flask import Flask, request, jsonify, send_from_directory
import glob
from flask_cors import CORS  # Import CORS

app = Flask(__name__)

# Enable CORS for the app
CORS(app)  # This allows all origins, you can configure this further if needed

# Directory paths
UPLOAD_FOLDER = "demo_audio/"
OUTPUT_FOLDER = "visualise/video/LS3DCG"  # Base folder without the 'Recording.wav' subfolder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    # Check if the audio file is part of the request
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    
    # Ensure the file has a valid name and save it to the upload folder
    if audio_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Set the path where the file will be saved in the demo_audio folder
    audio_filename = audio_file.filename
    audio_path = os.path.join(UPLOAD_FOLDER, audio_filename)  # Save in demo_audio/

    try:
        # Save the file to the upload folder (demo_audio/)
        audio_file.save(audio_path)
        print(f"Audio file saved: {audio_filename}")  # Log to confirm the file is saved
        
        # Ensure the file is correctly saved (for debugging purposes)
        if os.path.exists(audio_path):
            print(f"File successfully saved at: {audio_path}")
        else:
            print("File was not saved correctly.")
            return jsonify({"error": "Failed to save audio file"}), 500
        
        print(f"Files in upload folder: {os.listdir(UPLOAD_FOLDER)}")  # List files in the folder for verification
        
    except Exception as e:
        print(f"Error while saving file: {str(e)}")
        return jsonify({"error": f"Failed to save audio file: {str(e)}"}), 500
    
    print(f"Audio file path for --audio_file: {audio_path}")
    
    # Ensure the correct relative path for the audio file (e.g., ./demo_audio/Recording.wav)
    relative_audio_path = os.path.relpath(audio_path, start=os.getcwd())  # Convert to relative path
    print(f"Relative audio path: {relative_audio_path}")

    # Proceed with model execution using the relative audio file path
    command = [
        "python", "scripts/demo.py",
        "--config_file", "./config/LS3DCG.json",
        "--infer",
        "--audio_file", './'+relative_audio_path,  # Use relative path here
        "--body_model_name", "s2g_LS3DCG",
        "--body_model_path", "experiments/2022-10-19-smplx_S2G-LS3DCG/ckpt-99.pth",
        "--id", "0"
    ]
    
    print(f"Running command: {' '.join(command)}")  # Print the full command
    
    try:
        # Run the command and capture the output and error
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"Model execution output: {result.stdout}")
        if result.stderr:
            print(f"Model execution error: {result.stderr}")
    except subprocess.CalledProcessError as e:
        print(f"Error executing the command: {str(e)}")
        print(f"stderr: {e.stderr}")
        return jsonify({"error": f"Model processing failed: {str(e)}"}), 500
    
    print("Command executed successfully!")

    # Build the path to the folder containing the video (e.g., 'visualise/video/LS3DCG/Recording.wav')
    audio_folder_name = os.path.basename(audio_path)  # 'Recording.wav'
    video_folder_path = os.path.join(OUTPUT_FOLDER, audio_folder_name)  # Full path to the folder containing the video
    
    # List files in the output folder to confirm
    print(f"Checking output folder for video files: {os.listdir(video_folder_path)}")
    
    # Locate the generated video using glob
    video_files = glob.glob(os.path.join(video_folder_path, "*.mp4"))
    
    print(f"Video files found: {video_files}")
    
    if not video_files:
        print("No video files generated.")
        return jsonify({"error": "Video generation failed"}), 500
    else:
        print("Video files exist.")

    # Select the first video file
    video_path = video_files[0]

    # Confirm the file exists
    if not os.path.exists(video_path):
        print(f"Video file does not exist: {video_path}")
        return jsonify({"error": f"Video file not found at {video_path}"}), 500

    print(f"Video file chosen: {video_path}")

    # Generate the video URL
    filename = os.path.basename(video_path)
    video_url = f"http://127.0.0.1:5000/video/{os.path.relpath(video_path, OUTPUT_FOLDER)}"
    print(f"Generated video URL: {video_url}")

    return jsonify({"video_url": video_url})


@app.route('/video/<path:filename>', methods=['GET'])
def serve_video(filename):
    # Serve the video file from the output folder
    return send_from_directory(OUTPUT_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
