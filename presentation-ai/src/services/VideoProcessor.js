export class VideoProcessor {
  async processContent(input) {
    try {
      let endpoint, requestBody, options;
      
      // Get template info from input
      const template = input.template || 'think-outside';
      
      // Get the full URL for the template file
      const templateFile = input.templateFile ? 
        `${window.location.origin}/${input.templateFile}` : null;
      
      console.log('Using template:', template, 'with file:', templateFile);

      if (input.document) {
        endpoint = '/api/process-document';
        const formData = new FormData();
        formData.append('file', input.document);
        formData.append('template', template);
        formData.append('templateFile', templateFile);
        options = {
          method: 'POST',
          body: formData,
        };
      } else if (input.text || input.youtubeUrl) {
        endpoint = input.text ? '/api/process-text' : '/api/process-video';
        requestBody = {
          ...(input.text ? { text: input.text } : { youtubeUrl: input.youtubeUrl }),
          template,
          templateFile
        };
        options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        };
      } else {
        throw new Error('Invalid input type');
      }

      console.log('Sending request with options:', options);
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
      if (!(file instanceof Blob)) {
        reject(new Error('Invalid file format'));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
} 