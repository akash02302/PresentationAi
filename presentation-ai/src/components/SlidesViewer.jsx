import React from 'react';
import pptxgen from 'pptxgenjs';
import { toast } from 'react-hot-toast';

const SlidesViewer = ({ slides, template }) => {
  // Define template styles
  const templateStyles = {
    'think-outside': {
      title: {
        fontSize: 44,
        fontColor: '1a73e8',
        backgroundColor: 'FFFFFF',
        fontFace: 'Arial',
        alignment: 'center'
      },
      content: {
        fontSize: 18,
        fontColor: '666666',
        bulletColor: '1a73e8',
        backgroundColor: 'FFFFFF',
        fontFace: 'Arial',
        lineSpacing: 1.2
      }
    },
    'mirror-gram': {
      title: {
        fontSize: 40,
        fontColor: '000000',
        backgroundColor: 'F8F9FA',
        fontFace: 'Helvetica',
        alignment: 'left'
      },
      content: {
        fontSize: 16,
        fontColor: '333333',
        bulletColor: '000000',
        backgroundColor: 'F8F9FA',
        fontFace: 'Helvetica',
        lineSpacing: 1.5
      }
    },
    'digital-domination': {
      title: {
        fontSize: 48,
        fontColor: 'FFFFFF',
        backgroundColor: '000000',
        fontFace: 'Roboto',
        alignment: 'center'
      },
      content: {
        fontSize: 20,
        fontColor: 'FFFFFF',
        bulletColor: '1a73e8',
        backgroundColor: '000000',
        fontFace: 'Roboto',
        lineSpacing: 1.3
      }
    }
  };

  // Helper function to split content into chunks
  const splitContentIntoChunks = (text, maxPointsPerSlide = 4) => {
    const points = text.split('. ')
      .filter(point => point.trim().length > 0)
      .map(point => point.trim() + (point.endsWith('.') ? '' : '.'));
    
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;
    
    for (const point of points) {
      // Calculate length in words
      const wordCount = point.split(' ').length;
      
      // Start new chunk if:
      // 1. Current chunk has max points
      // 2. Adding this point would make the slide too text-heavy
      // 3. This point is very long
      if (currentChunk.length >= maxPointsPerSlide ||
          currentLength + wordCount > 50 ||
          wordCount > 20) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = [];
          currentLength = 0;
        }
        
        // If single point is very long, split it into multiple chunks
        if (wordCount > 20) {
          const sentences = point.split(/(?<=\. )/);
          for (const sentence of sentences) {
            if (sentence.trim()) {
              chunks.push([sentence.trim()]);
            }
          }
          continue;
        }
      }
      
      currentChunk.push(point);
      currentLength += wordCount;
    }
    
    // Add remaining points
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  const downloadPPT = async () => {
    try {
      console.log('Creating presentation with template:', template);
      const pres = new pptxgen();
      
      // Get template style
      const style = templateStyles[template] || templateStyles['think-outside'];
      console.log('Using style:', style);

      for (const slide of slides) {
        // Use the template from the slide or fall back to prop
        const slideTemplate = slide.template || template;
        const slideStyle = templateStyles[slideTemplate] || style;
        
        console.log('Processing slide with template:', slideTemplate);

        if (slide.is_title) {
          const titleSlide = pres.addSlide();
          titleSlide.background = { color: slideStyle.title.backgroundColor };
          
          titleSlide.addText(slide.heading, {
            x: 0.5,
            y: 1,
            w: '90%',
            h: 1,
            fontSize: slideStyle.title.fontSize,
            color: slideStyle.title.fontColor,
            fontFace: slideStyle.title.fontFace,
            align: slideStyle.title.alignment,
            bold: true,
          });

          if (slide.image && slide.image !== 'test_image_data') {
            try {
              const imageData = slide.image.includes('base64,') 
                ? slide.image.split('base64,')[1] 
                : slide.image;

              titleSlide.addImage({
                data: `data:image/jpeg;base64,${imageData}`,
                x: 0.5,
                y: 2,
                w: 8,
                h: 4,
              });
            } catch (imgError) {
              console.error('Error adding title image:', imgError);
            }
          }
        } else {
          const contentChunks = splitContentIntoChunks(slide.content);
          
          contentChunks.forEach((chunk, index) => {
            const contentSlide = pres.addSlide();
            
            // Apply content slide styling
            contentSlide.background = { color: slideStyle.content.backgroundColor };
            
            // Add heading
            contentSlide.addText(`${slide.heading}${contentChunks.length > 1 ? ` (${index + 1}/${contentChunks.length})` : ''}`, {
              x: 0.5,
              y: 0.3,
              w: '90%',
              h: 0.5,
              fontSize: slideStyle.content.fontSize,
              color: slideStyle.content.fontColor,
              fontFace: slideStyle.content.fontFace,
              bold: true,
            });

            // Add image only to first slide of the section
            if (index === 0 && slide.image && slide.image !== 'test_image_data') {
              try {
                const imageData = slide.image.includes('base64,') 
                  ? slide.image.split('base64,')[1] 
                  : slide.image;

                contentSlide.addImage({
                  data: `data:image/jpeg;base64,${imageData}`,
                  x: 0.5,
                  y: 1.2,
                  w: 8,
                  h: 3.5,
                });
              } catch (imgError) {
                console.error('Error adding content image:', imgError);
              }
            }

            // Add bullet points with template styling
            try {
              contentSlide.addText(chunk, {
                x: 0.5,
                y: index === 0 && slide.image ? 5 : 1.2,
                w: '90%',
                h: '40%',
                fontSize: slideStyle.content.fontSize,
                color: slideStyle.content.fontColor,
                fontFace: slideStyle.content.fontFace,
                bullet: { type: 'bullet', color: slideStyle.content.bulletColor },
                lineSpacing: slideStyle.content.lineSpacing,
                paraSpacing: 1.1,
                margin: 12,
                valign: 'top',
                indentLevel: 1,
              });
            } catch (textError) {
              console.error('Error adding text content:', textError);
              contentSlide.addText(chunk.join('. '), {
                x: 0.5,
                y: index === 0 && slide.image ? 5 : 1.2,
                w: '90%',
                h: '40%',
                fontSize: slideStyle.content.fontSize,
                color: slideStyle.content.fontColor,
                fontFace: slideStyle.content.fontFace,
                valign: 'top',
              });
            }
          });
        }
      }

      console.log('Writing presentation file...');
      await pres.writeFile('presentation.pptx');
      console.log('Presentation created successfully!');
      toast.success('Presentation downloaded successfully!');
    } catch (error) {
      console.error('Error creating presentation:', error);
      toast.error('Failed to download presentation');
    }
  };

  return (
    <div className="slides-viewer">
      <div className="slides-controls">
        <button onClick={downloadPPT} className="download-button">
          Download Presentation
        </button>
      </div>
      
      <div className="slides-grid">
        {slides.map((slide, index) => {
          const contentChunks = slide.is_title ? [slide.content] : splitContentIntoChunks(slide.content);
          
          return contentChunks.map((chunk, chunkIndex) => (
            <div key={`${index}-${chunkIndex}`} className="slide-preview">
              <h3 className="slide-heading">
                {slide.is_title ? slide.heading : 
                  `${slide.heading}${contentChunks.length > 1 ? ` (${chunkIndex + 1}/${contentChunks.length})` : ''}`}
              </h3>
              {(chunkIndex === 0 && slide.image && slide.image !== 'test_image_data') && (
                <img 
                  src={`data:image/jpeg;base64,${slide.image}`} 
                  alt={`Slide ${index + 1}`}
                  className="slide-image"
                />
              )}
              <div className="slide-content">
                {Array.isArray(chunk) ? chunk.map((point, i) => (
                  point.trim() && (
                    <p key={i} className="bullet-point">
                      • {point}
                    </p>
                  )
                )) : (
                  <p className="bullet-point">{chunk}</p>
                )}
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
};

export default SlidesViewer; 