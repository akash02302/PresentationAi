import google.generativeai as genai
from typing import List, Dict
import os
from dotenv import load_dotenv
import time
from datetime import datetime, timedelta

load_dotenv()  # Add this at the top with other imports

class TextProcessor:
    def __init__(self):

        # Initialize Gemini AI
        GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')  # Changed model here
        
        # Rate limiting settings
        self.requests_per_minute = 30  # Reduced from 60 to be safer
        self.requests_per_day = 500    # Reduced from 1000 to be safer
        self.request_timestamps = []
        self.daily_requests = 0
        self.last_reset = datetime.now()
        self.retry_delay = 30  # Default retry delay in seconds

    def _check_rate_limits(self):
        """Check and enforce rate limits"""
        current_time = datetime.now()
        
        # Reset daily counter if it's a new day
        if current_time.date() > self.last_reset.date():
            self.daily_requests = 0
            self.last_reset = current_time
        
        # Check daily limit
        if self.daily_requests >= self.requests_per_day:
            raise Exception("Daily request limit reached. Please try again tomorrow.")
        
        # Remove timestamps older than 1 minute
        self.request_timestamps = [ts for ts in self.request_timestamps 
                                 if current_time - ts < timedelta(minutes=1)]
        
        # Check per-minute limit
        if len(self.request_timestamps) >= self.requests_per_minute:
            # Calculate wait time
            oldest_request = min(self.request_timestamps)
            wait_time = 60 - (current_time - oldest_request).total_seconds()
            if wait_time > 0:
                time.sleep(wait_time)
        
        # Update counters
        self.request_timestamps.append(current_time)
        self.daily_requests += 1

    def _handle_api_error(self, error: Exception) -> List[Dict]:
        """Handle API errors gracefully"""
        error_message = str(error)
        
        if "429" in error_message:
            # Extract retry delay from error message if available
            if "retry_delay" in error_message:
                try:
                    import re
                    delay_match = re.search(r'retry_delay\s*{\s*seconds:\s*(\d+)', error_message)
                    if delay_match:
                        self.retry_delay = int(delay_match.group(1))
                except:
                    pass
            
            return [{
                "heading": "Rate Limit Reached",
                "text": f"The API rate limit has been reached. Please try again in {self.retry_delay} seconds.",
                "is_title": True
            }]
        elif "quota" in error_message.lower():
            return [{
                "heading": "Quota Exceeded",
                "text": "The daily API quota has been exceeded. Please try again tomorrow.",
                "is_title": True
            }]
        else:
            return [{
                "heading": "Error",
                "text": f"An error occurred: {error_message}",
                "is_title": True
            }]

    def process_topic(self, topic: str) -> List[Dict]:
        """Generate slides for a given topic"""
        try:
            self._check_rate_limits()
            
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
            return self._handle_api_error(e)

    def process_text(self, text: str) -> List[Dict]:
        """Process user-provided text into slides"""
        try:
            self._check_rate_limits()
            
            prompt = f"""
            Organize this text into a well-structured presentation. Return the response in the following JSON format:
            {{
                "sections": [
                    {{
                        "heading": "Section Title",
                        "points": [
                            "Point 1",
                            "Point 2",
                            "Point 3"
                        ]
                    }}
                ]
            }}

            Text to organize:
            {text}

            Requirements:
            - Create clear section headings
            - Include 3-4 key points per section
            - Keep points concise and clear
            - Ensure the response is valid JSON
            """

            response = self.model.generate_content(prompt)
            content = response.text
            print(f"Raw API response: {content}")  # Debug logging
            return self._organize_slides(content)
        except Exception as e:
            print(f"Error processing text: {e}")
            return self._handle_api_error(e)

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
            data = json.loads(content)
            
            # Extract sections from the response
            sections = data.get('sections', [])
            if not sections:
                raise ValueError("No sections found in the response")
            
            # Add title slide
            title = sections[0].get('heading', 'Presentation')
            slides.append({
                "heading": title,
                "text": "Generated with AI",
                "is_title": True
            })

            # Process each section
            for section in sections:
                heading = section.get('heading', 'Section')
                points = section.get('points', [])
                
                if not points:
                    continue
                
                # Split points into chunks of 3-4 for better readability
                max_points_per_slide = 4
                for i in range(0, len(points), max_points_per_slide):
                    chunk = points[i:i + max_points_per_slide]
                    slide_heading = heading
                    if i > 0:
                        slide_heading += f" (continued {i//max_points_per_slide + 1})"
                    
                    slide = {
                        "heading": slide_heading,
                        "content": "\n".join(f"• {point}" for point in chunk),
                        "is_title": False
                    }
                    slides.append(slide)
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw content: {content}")
            # Fallback to simple text splitting
            paragraphs = content.split('\n\n')
            for para in paragraphs:
                if para.strip():
                    lines = para.split('\n')
                    heading = lines[0]
                    text = '\n'.join(lines[1:]) if len(lines) > 1 else para
                    slide = {
                        "heading": heading,
                        "content": text,
                        "is_title": False
                    }
                    slides.append(slide)
        except Exception as e:
            print(f"Error organizing slides: {e}")
            print(f"Raw content: {content}")
            # Return a basic error slide
            slides = [{
                "heading": "Error Processing Content",
                "text": "Unable to process the content into slides. Please try again.",
                "is_title": True
            }]

        return slides