# Import required libraries
from flask import Flask, request, jsonify
from flask_cors import CORS  # Enable Cross-Origin Resource Sharing
import base64  # For handling base64 encoded images
import cv2     # For image processing
import numpy as np  # For numerical operations
from video_processor import VideoProcessor  # Custom video processing class
import os  # For file operations
from text_processor import TextProcessor  # Custom text processing class
from document_processor import IEEEDocumentProcessor  # Custom document processing class
import threading
import queue
from werkzeug.serving import make_server
import time

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create a queue for processing requests
processing_queue = queue.Queue()
processing_lock = threading.Lock()

# Create temporary directory for file uploads
if not os.path.exists('temp'):
    os.makedirs('temp')

# Global server instance
server = None

# Health check endpoint
@app.route('/')
def home():
    return jsonify({
        'status': 'running',
        'message': 'API is working. Use /api/process-video endpoint for video processing.'
    })

# Video processing endpoint
@app.route('/api/process-video', methods=['POST'])
def process_video():
    try:
        print("Received request")
        data = request.json
        print("Request data:", data)
        
        # Validate request data
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data received'
            }), 400
        
        # Use a lock to prevent concurrent processing
        with processing_lock:
            # Handle YouTube URL processing
            if 'youtubeUrl' in data:
                print("Processing YouTube URL:", data['youtubeUrl'])
                processor = VideoProcessor()
                slides = processor.process(data['youtubeUrl'])
            else:
                # Handle direct video upload
                print("Processing uploaded video")
                video_base64 = data['video'].split(',')[1]  # Remove data URL prefix
                video_bytes = base64.b64decode(video_base64)  # Decode base64 to bytes
                
                # Save video temporarily
                temp_path = 'temp/temp_video.mp4'
                with open(temp_path, 'wb') as f:
                    f.write(video_bytes)
                
                # Process video and generate slides
                processor = VideoProcessor()
                slides = processor.process(temp_path)
                
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        print("Slides generated:", slides)
        return jsonify({
            'success': True,
            'slides': slides
        })
    except Exception as e:
        print("Error:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Text processing endpoint
@app.route('/api/process-text', methods=['POST'])
def process_text():
    try:
        data = request.json
        processor = TextProcessor()
        
        # Handle topic-based or direct text input
        if 'topic' in data:
            slides = processor.process_topic(data['topic'])
        elif 'text' in data:
            slides = processor.process_text(data['text'])
        else:
            return jsonify({
                'success': False,
                'error': 'No topic or text provided'
            }), 400
            
        return jsonify({
            'success': True,
            'slides': slides
        })
    except Exception as e:
        print("Error:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Document processing endpoint
@app.route('/api/process-document', methods=['POST'])
def process_document():
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            }), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
            
        # Save uploaded file temporarily
        temp_path = os.path.join('temp', file.filename)
        file.save(temp_path)
        
        # Process document and generate slides
        processor = IEEEDocumentProcessor()
        slides = processor.process_document(temp_path)
        
        # Clean up temporary file
        os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'slides': slides
        })
    except Exception as e:
        print(f"Error processing document: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def start_server():
    global server
    server = make_server('127.0.0.1', 5000, app)
    server.serve_forever()

if __name__ == '__main__':
    try:
        # Start the server in a separate thread
        server_thread = threading.Thread(target=start_server)
        server_thread.daemon = True
        server_thread.start()
        
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        if server:
            server.shutdown()
        print("Server stopped.") 