import React from 'react';
import pptxgen from 'pptxgenjs';
import { toast } from 'react-hot-toast';

const SlidesViewer = ({ slides }) => {
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
      console.log('Starting presentation creation...');
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      for (const slide of slides) {
        console.log('Processing slide:', slide.heading);
        
        if (slide.is_title) {
          // Title slide - no need to split
          const titleSlide = pres.addSlide();
          titleSlide.addText(slide.heading, {
            x: 0.5,
            y: 1,
            w: '90%',
            h: 1,
            fontSize: 44,
            bold: true,
            color: '1a73e8',
            align: 'center',
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
          // Content slides - split if needed
          const contentChunks = splitContentIntoChunks(slide.text);
          
          contentChunks.forEach((chunk, index) => {
            const contentSlide = pres.addSlide();
            
            // Add heading (with continuation marker if split)
            contentSlide.addText(`${slide.heading}${contentChunks.length > 1 ? ` (${index + 1}/${contentChunks.length})` : ''}`, {
              x: 0.5,
              y: 0.3,
              w: '90%',
              h: 0.5,
              fontSize: 32,
              bold: true,
              color: '333333',
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

            // Add bullet points with updated styling
            try {
              contentSlide.addText(chunk, {
                x: 0.5,
                y: index === 0 && slide.image ? 5 : 1.2,
                w: '90%',
                h: '40%',
                fontSize: 18,
                color: '666666',
                bullet: { type: 'bullet' },
                lineSpacing: 1.2,
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
                fontSize: 18,
                color: '666666',
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
      console.error('Detailed error:', error);
      console.error('Error stack:', error.stack);
      toast.error('Failed to download presentation. Check console for details.');
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
          const contentChunks = slide.is_title ? [slide.text] : splitContentIntoChunks(slide.text);
          
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