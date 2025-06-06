# Presentation AI

An intelligent presentation generation system that automatically creates presentations from various input sources including videos, text, and documents.

## Features

- **Video to Presentation**: Convert videos (including YouTube videos) into structured presentations
- **Text to Presentation**: Generate presentations from text content or topics
- **Document to Presentation**: Create presentations from documents (with special support for IEEE format)
- **AI-Powered Analysis**: Uses advanced AI/ML models for content understanding and organization
- **Automatic Summarization**: Intelligent content summarization and organization
- **Smart Slide Generation**: Automatic selection of key frames and content for slides

## Technology Stack

### Backend
- Python 3.x
- Flask (Web Framework)
- PyTorch & TensorFlow (Machine Learning)
- OpenCV (Computer Vision)
- Transformers (NLP)
- Whisper (Audio Processing)
- Tesseract (OCR)

### Key Components
- Vision Transformer (ViT) for image feature extraction
- LSTM for temporal analysis
- BART for text summarization
- Whisper for audio transcription
- Custom processors for different input types

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/presentation-ai.git
cd presentation-ai
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
cd presentation-ai-backend
pip install -r requirements.txt
```

4. Install Tesseract OCR:
- Windows: Download and install from [Tesseract GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
- Linux: `sudo apt-get install tesseract-ocr`
- Mac: `brew install tesseract`

## Usage

1. Start the backend server:
```bash
cd presentation-ai-backend
python app.py
```

2. The server will start on `http://localhost:5000`

3. API Endpoints:
   - `/api/process-video`: Process video content
   - `/api/process-text`: Process text content
   - `/api/process-document`: Process document content

### Example API Usage

#### Process YouTube Video
```python
import requests

response = requests.post('http://localhost:5000/api/process-video', 
    json={'youtubeUrl': 'https://www.youtube.com/watch?v=example'})
slides = response.json()
```

#### Process Text
```python
response = requests.post('http://localhost:5000/api/process-text',
    json={'text': 'Your text content here'})
slides = response.json()
```

#### Process Document
```python
files = {'file': open('document.pdf', 'rb')}
response = requests.post('http://localhost:5000/api/process-document',
    files=files)
slides = response.json()
```

## Project Structure

```
presentation-ai/
├── presentation-ai-backend/
│   ├── app.py                 # Main Flask application
│   ├── video_processor.py     # Video processing module
│   ├── text_processor.py      # Text processing module
│   ├── document_processor.py  # Document processing module
│   └── requirements.txt       # Python dependencies
├── temp/                      # Temporary file storage
└── README.md                  # This file
```

## Features in Detail

### Video Processing
- Frame extraction and analysis
- Content summarization
- Automatic slide generation
- Support for YouTube videos
- Audio transcription

### Text Processing
- Topic-based content generation
- Direct text processing
- Content summarization
- Section organization

### Document Processing
- IEEE format support
- Document parsing
- Content extraction
- Slide generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Vision Transformer (ViT) by Google Research
- BART by Facebook Research
- Whisper by OpenAI
- Tesseract OCR
- All other open-source libraries used in this project 