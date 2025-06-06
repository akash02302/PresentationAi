import cv2
import numpy as np
import torch
import torch.nn as nn
from transformers import ViTImageProcessor, ViTModel
from PIL import Image
import pytesseract
import base64
from pytube import YouTube
import os
import yt_dlp
import whisper
from youtube_transcript_api import YouTubeTranscriptApi
from transformers import pipeline
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Adjust path if different

class VideoProcessor:
    def __init__(self):
        # Initialize the ViT model for feature extraction
        self.feature_extractor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
        self.vit_model = ViTModel.from_pretrained('google/vit-base-patch16-224')
        
        # Initialize LSTM for temporal analysis
        self.lstm = nn.LSTM(
            input_size=768,  # ViT feature size
            hidden_size=256,
            num_layers=2,
            batch_first=True
        )

        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        self.audio_model = whisper.load_model("base")

        # Initialize the model weights properly
        self._initialize_model_weights()

    def _initialize_model_weights(self):
        # Initialize the LSTM weights
        for name, param in self.lstm.named_parameters():
            if 'weight' in name:
                nn.init.xavier_uniform_(param)
            elif 'bias' in name:
                nn.init.zeros_(param)

        # Initialize the ViT model's pooler weights if they exist
        if hasattr(self.vit_model, 'pooler'):
            if hasattr(self.vit_model.pooler, 'dense'):
                nn.init.xavier_uniform_(self.vit_model.pooler.dense.weight)
                nn.init.zeros_(self.vit_model.pooler.dense.bias)

    def process(self, video_input):
        try:
            print(f"Processing video input: {video_input}")
            
            # Download YouTube video
            if 'youtube.com' in video_input or 'youtu.be' in video_input:
                video_path = self._download_youtube_video(video_input)
                print(f"Downloaded video to: {video_path}")
                # Get video text and summary
                summary = self._get_video_text(video_input, video_path)
            else:
                video_path = video_input
                summary = ""

            # Extract frames
            frames = self._extract_frames(video_path, sample_rate=60)  # Changed from 30 to 60
            print(f"Extracted {len(frames)} frames")
            
            # Extract features and analyze
            features = self._extract_features(frames)
            important_frames = self._analyze_temporal(features)
            print(f"Selected {len(important_frames)} important frames")
            
            # Create slides from important frames
            slides = self._create_slides(frames, important_frames, summary)
            
            # Cleanup downloaded video
            if 'youtube.com' in video_input or 'youtu.be' in video_input:
                if os.path.exists(video_path):
                    os.remove(video_path)
            
            return slides

        except Exception as e:
            print(f"Error in process: {str(e)}")
            raise e

    def _download_youtube_video(self, url):
        try:
            # Create temp directory if it doesn't exist
            if not os.path.exists('temp'):
                os.makedirs('temp')
            
            # Configure yt-dlp options
            ydl_opts = {
                'format': 'best[ext=mp4]',
                'outtmpl': os.path.join('temp', '%(id)s.mp4'),
                'quiet': True
            }
            
            # Download the video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                print(f"Downloading video from {url}")
                info = ydl.extract_info(url, download=True)
                video_id = info['id']
                temp_path = os.path.join('temp', f'{video_id}.mp4')
                
                if not os.path.exists(temp_path):
                    raise Exception("Download failed - file not created")
                    
                print(f"Video downloaded successfully to {temp_path}")
                return temp_path
                
        except Exception as e:
            print(f"Error in download: {str(e)}")
            raise Exception(f"Error downloading YouTube video: {str(e)}")

    def _extract_frames(self, video_path, sample_rate=60):  # Changed from 30 to 60
        frames = []
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Take max 100 frames regardless of video length
        target_frames = min(100, total_frames // sample_rate)
        sample_rate = total_frames // target_frames if target_frames > 0 else sample_rate
        
        frame_count = 0
        processed_frames = 0
        
        while cap.isOpened() and processed_frames < target_frames:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % sample_rate == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
                processed_frames += 1
            
            frame_count += 1
            
        cap.release()
        return frames

    def _extract_features(self, frames):
        features = []
        
        for frame in frames:
            # Convert to PIL Image
            pil_image = Image.fromarray(frame)
            
            # Extract features using ViT
            inputs = self.feature_extractor(images=pil_image, return_tensors="pt")
            with torch.no_grad():
                outputs = self.vit_model(**inputs)
            
            # Get the [CLS] token representation and flatten it
            feature = outputs.last_hidden_state[:, 0, :].squeeze(0).detach().numpy()  # Added detach()
            features.append(feature)
            
        return np.array(features)

    def _analyze_temporal(self, features, threshold=0.7):
        # Ensure features are the right shape
        features_tensor = torch.FloatTensor(features).unsqueeze(0)
        
        # Process through LSTM
        lstm_out, _ = self.lstm(features_tensor)
        
        # Calculate importance scores
        importance_scores = torch.sigmoid(lstm_out.squeeze(0)).detach()
        scores = importance_scores.numpy()
        
        # Dynamic slide count based on content length
        content_length = len(scores)
        if content_length <= 5:
            target_slides = content_length  # Very short content
        elif content_length <= 10:
            target_slides = 5  # Short content
        elif content_length <= 20:
            target_slides = 8  # Medium content
        else:
            target_slides = min(12, content_length // 3)  # Longer content
        
        # Select most important frames
        threshold = np.percentile(scores, 100 - (target_slides * 100 / len(scores)))
        important_indices = np.where(scores > threshold)[0]
        important_indices = [int(i) for i in important_indices[:target_slides]]
        
        if len(important_indices) < 1:
            important_indices = [0]
        
        print(f"Generated {len(important_indices)} slides based on content length of {content_length}")
        return important_indices

    def _get_video_text(self, url, video_path):
        try:
            # Get transcript and organize by topics
            video_id = url.split('watch?v=')[1] if 'watch?v=' in url else url.split('/')[-1].split('?')[0]
            
            # Try different language codes
            transcript = None
            try_languages = ['en', 'en-US', 'en-GB', 'en-IN']  # Add more if needed
            
            for lang in try_languages:
                try:
                    transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                    break  # Break if successful
                except Exception as e:
                    print(f"Couldn't get transcript for language {lang}: {str(e)}")
                    continue
            
            if transcript:
                full_text = ' '.join([t['text'] for t in transcript])
                sections = self._organize_content(full_text)
                return sections
            
            # If no transcript found, try auto-translate
            try:
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                transcript = transcript_list.find_transcript(['hi'])  # Try Hindi since it's available
                translated = transcript.translate('en')  # Translate to English
                full_text = ' '.join([t['text'] for t in translated.fetch()])
                sections = self._organize_content(full_text)
                return sections
            except Exception as e:
                print(f"Translation failed: {str(e)}")
            
            # If all above fails, try whisper
            print(f"Starting audio transcription for {video_path}")
            if not os.path.exists(video_path):
                raise Exception(f"Video file not found at {video_path}")
            
            result = self.audio_model.transcribe(video_path, fp16=False)
            sections = self._organize_content(result["text"])
            return sections
            
        except Exception as e:
            print(f"All transcript methods failed: {e}")
            return [{"heading": "Content", "content": "No text could be extracted from the video"}]

    def _organize_content(self, text):
        try:
            # Split text into sentences
            sentences = text.split('. ')
            sections = []
            current_section = []
            
            # Keywords for topic detection
            topics = {
                'introduction': ['introduction', 'begin', 'first', 'start'],
                'main_points': ['key point', 'important', 'main', 'significant', 'feature', 'benefit'],
                'examples': ['example', 'instance', 'case', 'illustration', 'such as'],
                'conclusion': ['conclusion', 'finally', 'in summary', 'to conclude', 'lastly']
            }
            
            # Force create sections every N sentences if no topic markers found
            SECTION_SIZE = 4
            
            for i, sentence in enumerate(sentences):
                current_section.append(sentence)
                
                # Check for topic changes or section size limit
                should_split = False
                detected_topic = None
                
                # Check for topic markers
                for topic, keywords in topics.items():
                    if any(keyword in sentence.lower() for keyword in keywords):
                        detected_topic = topic
                        should_split = True
                        break
                
                # Split if section is long enough or it's a topic change
                if should_split or len(current_section) >= SECTION_SIZE or i == len(sentences) - 1:
                    if current_section:
                        full_text = '. '.join(current_section)
                        summary = self._summarize_text(full_text)
                        
                        # Generate appropriate heading
                        if detected_topic:
                            heading = self._generate_heading(detected_topic, current_section[0])
                        else:
                            # Extract key phrases for heading if no topic detected
                            first_sentence = current_section[0]
                            words = first_sentence.split()
                            heading = ' '.join(words[:6]) + "..."
                        
                        sections.append({
                            "heading": heading,
                            "content": summary
                        })
                        current_section = []
            
            # Ensure we have at least some sections
            if not sections:
                sections = [{
                    "heading": "Key Points",
                    "content": self._summarize_text(text)
                }]
            
            return sections
        
        except Exception as e:
            print(f"Error organizing content: {e}")
            return [{"heading": "Content", "content": content}]

    def _summarize_text(self, text):
        try:
            words = text.split()
            # If text is too short, return as is
            if len(words) < 50:
                return text

            # Calculate appropriate max_length based on input length
            input_length = len(words)
            max_length = min(input_length - 10, 100)  # Make summary shorter than input
            min_length = min(30, max_length - 10)  # Ensure min_length is less than max_length
            
            # Process text in smaller chunks
            chunks = []
            max_chunk_length = 500
            
            for i in range(0, len(words), max_chunk_length):
                chunk = ' '.join(words[i:i + max_chunk_length])
                if len(chunk.split()) > 50:  # Only summarize if chunk is long enough
                    try:
                        summary = self.summarizer(
                            chunk,
                            max_length=max_length,
                            min_length=min_length,
                            do_sample=False,
                            truncation=True,
                            length_penalty=2.0,  # Encourage concise summaries
                        )
                        chunks.append(summary[0]['summary_text'])
                    except Exception as e:
                        print(f"Error summarizing chunk: {e}")
                        # Extract key sentences instead of using full chunk
                        sentences = chunk.split('. ')
                        key_sentences = sentences[:3]  # Take first 3 sentences
                        chunks.append('. '.join(key_sentences))
                else:
                    chunks.append(chunk)
            
            return ' '.join(chunks)
        except Exception as e:
            print(f"Error in text summarization: {e}")
            return text[:500] + "..."  # Return truncated text if summarization fails

    def _generate_heading(self, topic_type, first_sentence):
        try:
            # Create meaningful headings based on topic type
            if topic_type == 'introduction':
                return "Introduction"
            elif topic_type == 'main_points':
                # Extract key phrase from first sentence
                words = first_sentence.split()
                heading = ' '.join(words[:5]) + "..."
                return f"Key Point: {heading}"
            elif topic_type == 'examples':
                return "Example & Illustration"
            elif topic_type == 'conclusion':
                return "Conclusion"
            else:
                # Generate heading from first sentence
                words = first_sentence.split()
                if len(words) > 5:
                    return ' '.join(words[:5]) + "..."
                return first_sentence
        except Exception as e:
            print(f"Error generating heading: {e}")
            return "Section"

    def _create_slides(self, frames, important_indices, sections):
        slides = []
        
        # Create title slide
        title_slide = {
            'image': self._encode_frame(frames[0]),
            'content': 'Video Summary',
            'heading': 'Video Presentation',
            'is_title': True
        }
        slides.append(title_slide)
        
        # Create content slides based on sections
        for i, section in enumerate(sections):
            if i >= len(important_indices):
                break
            
            frame = frames[important_indices[i]]
            
            slide = {
                'image': self._encode_frame(frame),
                'content': section['content'],
                'heading': section['heading'],
                'timestamp': int(important_indices[i]),
                'is_title': False
            }
            slides.append(slide)
        
        return slides

    def _encode_frame(self, frame):
        # Convert frame to base64 for transmission
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
        return base64.b64encode(buffer).decode('utf-8') 