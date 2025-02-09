export class VideoProcessor {
  async processContent(input) {
    try {
      let endpoint, requestBody, options;
      
      if (input instanceof File) {
        // Handle document upload
        endpoint = '/api/process-document';
        const formData = new FormData();
        formData.append('file', input);
        options = {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary
        };
      } else if (typeof input === 'string') {
        // Handle YouTube URL or text input
        if (input.includes('youtube.com') || input.includes('youtu.be')) {
          endpoint = '/api/process-video';
          requestBody = { youtubeUrl: input };
        } else {
          endpoint = '/api/process-text';
          requestBody = input.includes('\n') ? { text: input } : { topic: input };
        }
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        };
      } else {
        endpoint = '/api/process-video';
        const videoBase64 = await this.fileToBase64(input);
        requestBody = { video: videoBase64 };
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, options);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    } catch (error) {
      console.error('Error processing content:', error);
      throw error;
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
} 