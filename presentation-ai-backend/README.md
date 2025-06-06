# Presentation AI Backend

The backend service for the Presentation AI system, handling video, text, and document processing with AI-powered analysis.

## Architecture

### Core Components

1. **Video Processor (`video_processor.py`)**
   - Vision Transformer (ViT) for frame analysis
   - LSTM for temporal analysis
   - YouTube video processing
   - Audio transcription with Whisper
   - Frame extraction and analysis
   - Automatic slide generation

2. **Text Processor (`text_processor.py`)**
   - Content analysis and organization
   - Topic detection
   - Text summarization using BART
   - Section generation

3. **Document Processor (`document_processor.py`)**
   - IEEE format document parsing
   - Content extraction
   - Structure analysis
   - Slide generation

4. **Main Application (`app.py`)**
   - Flask web server
   - RESTful API endpoints
   - Request handling
   - Concurrent processing

## API Endpoints

### 1. Video Processing
```http
POST /api/process-video
Content-Type: application/json

{
    "youtubeUrl": "https://www.youtube.com/watch?v=example"
}
```
or
```http
POST /api/process-video
Content-Type: application/json

{
    "video": "base64_encoded_video_data"
}
```

### 2. Text Processing
```http
POST /api/process-text
Content-Type: application/json

{
    "text": "Your text content here"
}
```
or
```http
POST /api/process-text
Content-Type: application/json

{
    "topic": "Your topic here"
}
```

### 3. Document Processing
```http
POST /api/process-document
Content-Type: multipart/form-data

file: your_document.pdf
```

## Response Format

All endpoints return JSON responses in the following format:
```json
{
    "success": true,
    "slides": [
        {
            "image": "base64_encoded_image",
            "content": "Slide content",
            "heading": "Slide heading",
            "timestamp": 123,
            "is_title": false
        }
    ]
}
```

## Setup and Installation

1. **Prerequisites**
   - Python 3.x
   - Tesseract OCR
   - CUDA (optional, for GPU acceleration)

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables**
   - Create a `.env` file with necessary configurations
   - Set Tesseract path if different from default

4. **Start Server**
   ```bash
   python app.py
   ```

## Technical Details

### Video Processing Pipeline
1. Frame Extraction (60 FPS)
2. Feature Extraction (ViT)
3. Temporal Analysis (LSTM)
4. Content Organization
5. Slide Generation

### Text Processing Pipeline
1. Content Analysis
2. Topic Detection
3. Summarization
4. Section Organization
5. Slide Generation

### Document Processing Pipeline
1. Document Parsing
2. Content Extraction
3. Structure Analysis
4. Slide Generation

## Error Handling

The backend implements comprehensive error handling:
- Input validation
- File format checking
- Processing error recovery
- API error responses

## Performance Considerations

1. **Concurrent Processing**
   - Thread-safe operations
   - Queue-based request handling
   - Resource management

2. **Memory Management**
   - Temporary file cleanup
   - Large file handling
   - Resource optimization

3. **Caching**
   - Model caching
   - Feature caching
   - Result caching

## Development

### Code Structure
```
presentation-ai-backend/
├── app.py                 # Main Flask application
├── video_processor.py     # Video processing module
├── text_processor.py      # Text processing module
├── document_processor.py  # Document processing module
├── requirements.txt       # Python dependencies
└── temp/                  # Temporary file storage
```

### Adding New Features
1. Create new processor class if needed
2. Add new endpoint in `app.py`
3. Update requirements if necessary
4. Add tests for new functionality

## Testing

Run tests using:
```bash
python -m pytest tests/
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## License

This project is licensed under the MIT License. 