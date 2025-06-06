import PyPDF2
from docx import Document
from typing import List, Dict, Optional
import os
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import nltk
import re
from collections import defaultdict

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')

class IEEEDocumentProcessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.section_patterns = {
            'title': r'^\s*#\s+.+$',
            'abstract': r'^\s*abstract\s*.*$',
            'index_terms': r'^\s*index\s+terms\s*.*$|^\s*keywords\s*.*$',
            'introduction': r'^\s*[i1]\.?\s+introduction\s*.*$',
            'related_work': r'^\s*[ii2]\.?\s+related\s+work\s*.*$',
            'methodology': r'^\s*[iii3]\.?\s+method(ology)?\s*.*$',
            'results': r'^\s*[iv4]\.?\s+results\s*.*$',
            'discussion': r'^\s*[v5]\.?\s+discussion\s*.*$',
            'conclusion': r'^\s*[vi6]\.?\s+conclusion\s*.*$',
            'references': r'^\s*references\s*$|^\s*bibliography\s*$'
        }
        self.ignore_patterns = r'acknowledgments|appendix|author\s+biographies'
        self.figure_pattern = r'fig\.?\s*\d+|figure\s*\d+'
        self.table_pattern = r'table\s*\d+'
        self.column_threshold = 300

    def _clean_text(self, text: str) -> str:
        text = re.sub(r'\[\d+(?:-\d+)?(?:,\s*\d+)*\]', '', text)
        text = re.sub(r'[A-Z][a-z]+\s+et\s+al\.?,?\s*(\(\d{4}\))?', '', text)
        text = re.sub(r'http[s]?://\S+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        text = re.sub(self.figure_pattern, '', text, flags=re.IGNORECASE)
        text = re.sub(self.table_pattern, '', text, flags=re.IGNORECASE)
        return re.sub(r'\s+', ' ', text).strip()

    def _process_two_columns(self, text: str) -> str:
        lines = text.split('\n')
        column1 = []
        column2 = []
        current_column = 1

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if (current_column == 1 and len(column1) > 0 and 
                (len(stripped) < 15 or stripped.isupper())):
                current_column = 2
            if current_column == 1:
                column1.append(stripped)
            else:
                column2.append(stripped)

        return '\n'.join(column1 + column2)

    def _extract_paper_title(self, text: str) -> str:
        lines = text.split('\n')[:10]
        for line in lines:
            line = line.strip()
            if not line or line.lower() in ['abstract', 'introduction']:
                continue
            if (len(line) < 120 and 
                sum(1 for c in line if c.isupper()) > len(line)/4):
                return line
        return "Research Paper Summary"

    def _identify_sections(self, text: str) -> Dict[str, str]:
        sections = {}
        lines = text.split('\n')
        current_section = None
        current_content = []

        for line in lines:
            line = line.strip()
            print(f"[DEBUG] Processing line: '{line}'")
            if not line:
                print("[DEBUG] Skipping empty line")
                continue

            is_section_header = False
            for section_type, pattern in self.section_patterns.items():
                print(f"[DEBUG] Testing pattern '{pattern}' for section '{section_type}'")
                if re.search(pattern, line, re.IGNORECASE):
                    print(f"[DEBUG] Match found for section pattern '{section_type}'")
                    if current_section:
                        content_text = '\n'.join(current_content)
                        print(f"[DEBUG] Storing content for section '{current_section}'. Content length: {len(content_text)}")
                        sections[current_section] = content_text

                    current_section = section_type
                    current_content = []
                    is_section_header = True
                    print(f"[DEBUG] Current section set to: '{current_section}'")
                    break

            if re.search(self.ignore_patterns, line.lower()):
                print(f"[DEBUG] Line matches ignore pattern: '{line}'")
                continue

            if not is_section_header and current_section:
                if not re.match(r'^\d+\s*$', line):
                    current_content.append(line)
                    print(f"[DEBUG] Appending line to current_content for section '{current_section}': '{line[:50]}'...")

        if current_section and current_content:
            final_content = '\n'.join(current_content)
            sections[current_section] = final_content
            print(f"[DEBUG] Storing final content for section '{current_section}'. Content length: {len(final_content)}")

        return sections

    def _extract_key_points(self, text: str, max_points: int = 5) -> List[str]:
        text = self._clean_text(text)
        sentences = sent_tokenize(text)

        if not sentences:
            return []

        if len(sentences) >= 3 and text.lower().startswith('abstract'):
            return [sentences[0], sentences[-1]] + sentences[1:max_points-1]

        scores = {}
        word_freq = defaultdict(int)

        for sentence in sentences:
            words = word_tokenize(sentence.lower())
            for word in words:
                if word not in self.stop_words and word.isalnum():
                    word_freq[word] += 1

        for sentence in sentences:
            words = word_tokenize(sentence.lower())
            score = sum(word_freq.get(word, 0) for word in words if word not in self.stop_words)

            if any(char.isdigit() for char in sentence):
                score *= 1.5
            if any(len(word) >= 8 for word in words):
                score *= 1.3
            if sentence.startswith(('The ', 'This ', 'These ', 'We ', 'Our ')):
                score *= 1.2
            if re.search(r'\([A-Z]{2,}\)', sentence):
                score *= 1.2

            scores[sentence] = score / max(1, len(words))

        return [sent for sent, _ in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:max_points]]

    def _extract_from_pdf(self, file_path: str) -> str:
        text = []
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    processed_text = self._process_two_columns(page_text)
                    processed_text = re.sub(r'\s+\n\s+', '\n', processed_text)
                    processed_text = re.sub(r'-\n(\w)', r'\1', processed_text)
                    text.append(processed_text)

        full_text = '\n'.join(text)
        full_text = re.sub(r'(\n\s*){3,}', '\n\n', full_text)
        return re.sub(r'^\s*\d+\s*$', '', full_text, flags=re.MULTILINE)

    def _extract_from_docx(self, file_path: str) -> str:
        doc = Document(file_path)
        text = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text.append(paragraph.text)
        return '\n'.join(text)

    def _extract_from_txt(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()

    def _extract_text(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext == '.pdf':
            return self._extract_from_pdf(file_path)
        elif file_ext in ['.docx', '.doc']:
            return self._extract_from_docx(file_path)
        elif file_ext == '.txt':
            return self._extract_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

    def _create_slide(self, heading: str, content: str, is_title: bool = False) -> Dict:
        return {
            "heading": heading,
            "content": content,
            "is_title": is_title,
            "is_bulleted": not is_title
        }

    def _organize_slides(self, sections: Dict[str, str]) -> List[Dict]:
        slides = []
        paper_title = self._extract_paper_title(sections.get('abstract', ''))

        slides.append(self._create_slide(
            heading=paper_title,
            content="Key Findings and Contributions",
            is_title=True
        ))

        if 'abstract' in sections:
            first_para = sections['abstract'].split('\n')[0]
            if ' et al. ' in first_para or 'University' in first_para:
                slides.append(self._create_slide(
                    heading="Authors",
                    content=f"• {first_para[:200]}...",
                    is_title=False
                ))

        if 'abstract' in sections:
            points = self._extract_key_points(sections['abstract'], 4)
            if points:
                slides.append(self._create_slide(
                    heading="Key Contributions",
                    content="\n".join(f"• {point}" for point in points)
                ))

        if 'index_terms' in sections:
            keywords = sections['index_terms'].replace('Index Terms—', '').split(';')
            keywords = [kw.strip() for kw in keywords if kw.strip()][:5]
            if keywords:
                slides.append(self._create_slide(
                    heading="Keywords",
                    content="\n".join(f"• {kw}" for kw in keywords)
                ))

        section_order = ['introduction', 'related_work', 'methodology',
                         'results', 'discussion', 'conclusion']

        for section in section_order:
            if section not in sections:
                continue
            content = sections[section]
            max_points = 6 if section in ['methodology', 'results'] else 4
            points = self._extract_key_points(content, max_points)
            if not points:
                continue
            heading = section.replace('_', ' ').title()
            if section == 'related_work':
                heading = "Literature Review"
            chunk_size = 3 if section in ['methodology', 'results'] else 4
            for i in range(0, len(points), chunk_size):
                chunk = points[i:i + chunk_size]
                current_heading = heading if i == 0 else f"{heading} (Cont.)"
                slides.append(self._create_slide(
                    heading=current_heading,
                    content="\n".join(f"• {point}" for point in chunk)
                ))

        if 'references' in sections:
            ref_count = len(re.findall(r'\[\d+\]', sections['references']))
            if ref_count > 0:
                slides.append(self._create_slide(
                    heading="References",
                    content=f"• Contains {ref_count} references\n• Key papers cited in this work"
                ))

        return slides

    def process_document(self, file_path: str) -> List[Dict]:
        try:
            text = self._extract_text(file_path)
            sections = self._identify_sections(text)
            return self._organize_slides(sections)
        except Exception as e:
            return [self._create_slide(
                heading="Processing Error",
                content=str(e),
                is_title=True
            )]


if __name__ == "__main__":
    processor = IEEEDocumentProcessor()
    file_path = "ieee_submission-2.pdf"

    try:
        print(f"Processing document: {file_path}")
        text = processor._extract_text(file_path)
        print("--- Extracted Text ---")
        print(text[:2000] + "...")
        print("----------------------")

        sections = processor._identify_sections(text)
        print("--- Identified Sections ---")
        for section, content in sections.items():
            print(f"Section: {section}, Content Length: {len(content)}")
        print("-------------------------")

        slides = processor._organize_slides(sections)

        print(f"\nGenerated {len(slides)} professional slides:")
        for i, slide in enumerate(slides):
            print(f"\nSlide {i+1}: {slide['heading']}")
            print(slide['content'])
    except Exception as e:
        print(f"Error during test execution: {e}")
