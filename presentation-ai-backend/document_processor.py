import PyPDF2
from docx import Document
from typing import List, Dict
import os
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import nltk
import re

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')

class DocumentProcessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        # Define important section patterns
        self.section_patterns = {
            'abstract': r'abstract|summary',
            'introduction': r'introduction|background',
            'methodology': r'method|methodology|materials\s+and\s+methods|experimental',
            'results': r'results|findings',
            'discussion': r'discussion|analysis',
            'conclusion': r'conclusion|concluding\s+remarks|future\s+work'
        }
        # Define patterns for sections to ignore
        self.ignore_patterns = r'references|bibliography|acknowledgments|author|citation|appendix|copyright'

    def _clean_text(self, text: str) -> str:
        """Clean text by removing citations, references, and other noise"""
        # Remove citations [1], [2-4], etc.
        text = re.sub(r'\[\d+(?:-\d+)?\]', '', text)
        # Remove author references (Name et al.)
        text = re.sub(r'[A-Z][a-z]+\s+et\s+al\.?,?\s+\(\d{4}\)', '', text)
        # Remove URLs
        text = re.sub(r'http[s]?://\S+', '', text)
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        # Clean extra whitespace
        text = ' '.join(text.split())
        return text

    def _identify_sections(self, text: str) -> Dict[str, str]:
        """Identify and extract important sections"""
        sections = {}
        lines = text.split('\n')
        current_section = None
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if line is a section header
            is_section_header = False
            for section_type, pattern in self.section_patterns.items():
                if re.match(f'^{pattern}', line.lower()):
                    if current_section:
                        sections[current_section] = '\n'.join(current_content)
                    current_section = section_type
                    current_content = []
                    is_section_header = True
                    break
                    
            # Skip if line matches ignore patterns
            if re.search(self.ignore_patterns, line.lower()):
                continue
                
            if not is_section_header and current_section:
                current_content.append(line)
                
        # Add last section
        if current_section and current_content:
            sections[current_section] = '\n'.join(current_content)
            
        return sections

    def _extract_key_points(self, text: str, max_points=3) -> List[str]:
        """Extract key points from section text"""
        # Clean the text first
        text = self._clean_text(text)
        sentences = sent_tokenize(text)
        
        # Score sentences based on importance
        scores = {}
        word_freq = {}
        
        # Calculate word frequencies
        for sentence in sentences:
            words = word_tokenize(sentence.lower())
            for word in words:
                if word not in self.stop_words and word.isalnum():
                    word_freq[word] = word_freq.get(word, 0) + 1
        
        # Score sentences
        for sentence in sentences:
            words = word_tokenize(sentence.lower())
            score = sum(word_freq.get(word, 0) for word in words if word not in self.stop_words)
            # Bonus for sentences with numbers (often important in scientific papers)
            if any(char.isdigit() for char in sentence):
                score *= 1.2
            scores[sentence] = score / len(words)
        
        # Select top scoring sentences
        important_sentences = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:max_points]
        return [sent for sent, _ in important_sentences]

    def _extract_text(self, file_path: str) -> str:
        """Extract text from different document types"""
        file_ext = file_path.lower().split('.')[-1]
        
        if file_ext == 'pdf':
            return self._extract_from_pdf(file_path)
        elif file_ext in ['docx', 'doc']:
            return self._extract_from_docx(file_path)
        elif file_ext == 'txt':
            return self._extract_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

    def _extract_from_pdf(self, file_path: str) -> str:
        text = []
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text.append(page.extract_text())
        return ' '.join(text)

    def _extract_from_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        return ' '.join([paragraph.text for paragraph in doc.paragraphs])

    def _extract_from_txt(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()

    def _organize_slides(self, sections: Dict[str, List[str]]) -> List[Dict]:
        """Convert sections into slides"""
        slides = []
        
        # Add title slide
        slides.append({
            "heading": "Document Summary",
            "text": "Key Findings and Insights",
            "is_title": True
        })
        
        # Process each section
        section_order = ['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion']
        for section in section_order:
            if section not in sections:
                continue
                
            points = self._extract_key_points(sections[section])
            if not points:
                continue
                
            # Split into multiple slides if needed
            max_points_per_slide = 3
            for i in range(0, len(points), max_points_per_slide):
                chunk = points[i:i + max_points_per_slide]
                heading = section.title()
                if i > 0:
                    heading += f" (continued {i//max_points_per_slide + 1})"
                
                slides.append({
                    "heading": heading,
                    "text": "\n".join(f"• {point}" for point in chunk),
                    "is_title": False
                })
        
        return slides

    def process_document(self, file_path: str) -> List[Dict]:
        """Process document and generate slides"""
        try:
            # Extract text
            text = self._extract_text(file_path)
            # Identify sections
            sections = self._identify_sections(text)
            # Generate slides
            return self._organize_slides(sections)
        except Exception as e:
            print(f"Error processing document: {e}")
            return [{"heading": "Error", "text": "Failed to process document", "is_title": True}] 