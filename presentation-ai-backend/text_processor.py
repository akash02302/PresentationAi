import google.generativeai as genai
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()  # Add this at the top with other imports

class TextProcessor:
    def __init__(self):
        # Initialize Gemini AI
        GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')

    def process_topic(self, topic: str) -> List[Dict]:
        """Generate slides for a given topic"""
        try:
            # Prompt engineering for better slide content
            prompt = f"""
            Create a comprehensive presentation about "{topic}". Structure it as follows:
            1. Introduction to {topic}
            2. Key concepts and fundamentals
            3. Important features or components
            4. Best practices and tips
            5. Real-world applications
            6. Conclusion

            For each section, provide:
            - A clear heading
            - 3-4 key points in bullet form
            - Keep each point concise (max 20 words)
            Format as JSON with sections array containing heading and points.
            """

            response = self.model.generate_content(prompt)
            content = response.text
            return self._organize_slides(content)
        except Exception as e:
            print(f"Error generating topic slides: {e}")
            return [{"heading": topic, "text": "Failed to generate content", "is_title": True}]

    def process_text(self, text: str) -> List[Dict]:
        """Process user-provided text into slides"""
        try:
            prompt = f"""
            Organize this text into a well-structured presentation:

            {text}

            Create sections with:
            - Clear headings for each section
            - Key points in bullet form
            - Keep each point concise
            Format as JSON with sections array containing heading and points.
            """

            response = self.model.generate_content(prompt)
            content = response.text
            return self._organize_slides(content)
        except Exception as e:
            print(f"Error processing text: {e}")
            return [{"heading": "Content", "text": text, "is_title": True}]

    def _organize_slides(self, content: str) -> List[Dict]:
        """Convert Gemini response into slide format"""
        slides = []
        
        try:
            # Clean up the content string to ensure valid JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content.split('```json')[1]
            if content.endswith('```'):
                content = content.rsplit('```', 1)[0]
            
            # Parse the JSON response
            import json
            sections = json.loads(content)
            
            # Add title slide
            title = sections.get('title', 'Presentation')
            slides.append({
                "heading": title,
                "text": sections.get('description', 'Generated with AI'),
                "is_title": True
            })

            # Process each section
            for section in sections['sections']:
                # Handle different JSON formats
                heading = section.get('heading', section.get('title', 'Section'))
                points = section.get('points', section.get('content', []))
                
                # Format bullet points
                if isinstance(points, list):
                    text = "\n".join(f"• {point}" for point in points)
                else:
                    text = f"• {points}"  # Handle single string content
                
                slide = {
                    "heading": heading,
                    "text": text,
                    "is_title": False
                }
                slides.append(slide)
            
        except Exception as e:
            print(f"Error parsing JSON content: {e}")
            print(f"Raw content: {content}")
            # Fallback to simple text splitting
            paragraphs = content.split('\n\n')
            for para in paragraphs:
                if para.strip():
                    slide = {
                        "heading": para.split('\n')[0],
                        "text": para,
                        "is_title": False
                    }
                    slides.append(slide)

        return slides 