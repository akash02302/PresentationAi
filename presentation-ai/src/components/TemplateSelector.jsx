import React, { useState } from 'react';
import '../styles/TemplateSelector.css';
import { useNavigate } from 'react-router-dom';

const templates = [
  {
    id: 'think-outside',
    name: 'Think Outside the Box',
    thumbnail: '/templates/minimal/thumbnail.png',
    templateFile: 'templates/minimal/template.pptx',
    description: 'Creative Problem-Solving for Innovators'
  },
  {
    id: 'mirror-gram',
    name: 'Mirror, Mirror on the Gram',
    thumbnail: '/templates/modern/thumbnail.png',
    templateFile: 'templates/modern/template.pptx',
    description: 'The Psychological Impact of Filters'
  },
  {
    id: 'digital-domination',
    name: 'Digital Domination',
    thumbnail: '/templates/creative/thumbnail.png',
    templateFile: 'templates/creative/template.pptx',
    description: 'Tactics for Online Success'
  }
];

const templateSlides = {
  'think-outside': [
    '/templates/minimal/slide1.png',
    '/templates/minimal/slide2.png',
    '/templates/minimal/slide3.png',
  ],
  'mirror-gram': [
    '/templates/modern/slide1.png',
    '/templates/modern/slide2.png',
    '/templates/modern/slide3.png',
  ],
  'digital-domination': [
    '/templates/creative/slide1.png',
    '/templates/creative/slide2.png',
    '/templates/creative/slide3.png',
  ],
};

const TemplateSelector = ({ selectedTemplate, onTemplateSelect }) => {
  const navigate = useNavigate();
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleUseTemplate = (templateId) => {
    // Get the template file path
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect({
        id: templateId,
        templateFile: template.templateFile  // Pass the template file path
      });
    }
    // Scroll to input section smoothly
    const inputSection = document.querySelector('.input-section');
    if (inputSection) {
      inputSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setCurrentSlide(0);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setCurrentSlide(0);
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    if (previewTemplate && templateSlides[previewTemplate.id]) {
      const maxSlides = templateSlides[previewTemplate.id].length;
      setCurrentSlide((prev) => (prev + 1) % maxSlides);
    }
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    if (previewTemplate && templateSlides[previewTemplate.id]) {
      const maxSlides = templateSlides[previewTemplate.id].length;
      setCurrentSlide((prev) => (prev - 1 + maxSlides) % maxSlides);
    }
  };

  return (
    <div className="template-selector">
      <h2>Presentations made by PresentationAi App</h2>
      <div className="templates-carousel">
        {templates.map((template) => (
          <div 
            key={template.id}
            className={`template-slide ${selectedTemplate === template.id ? 'selected' : ''}`}
          >
            <div className="template-content">
              <img 
                src={template.thumbnail} 
                alt={template.name} 
                className="template-preview"
              />
              <div className="template-overlay">
                <button 
                  className="use-template-btn"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  Use Template
                </button>
                <button 
                  className="preview-btn"
                  onClick={() => handlePreview(template)}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="preview-modal-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <button className="close-preview" onClick={closePreview}>×</button>
            <div className="preview-content">
              <h2>{previewTemplate.name}</h2>
              
              <div className="preview-slideshow">
                <button 
                  className="slide-nav prev" 
                  onClick={prevSlide}
                >
                  ‹
                </button>
                
                <div className="preview-image">
                  <img 
                    src={templateSlides[previewTemplate.id]?.[currentSlide] || previewTemplate.thumbnail} 
                    alt={`Slide ${currentSlide + 1}`} 
                  />
                  <div className="slide-counter">
                    {currentSlide + 1} / {templateSlides[previewTemplate.id]?.length || 1}
                  </div>
                </div>

                <button 
                  className="slide-nav next" 
                  onClick={nextSlide}
                >
                  ›
                </button>
              </div>

              <div className="preview-details">
                <p>{previewTemplate.description}</p>
                <div className="preview-actions">
                  <button 
                    className="use-template-btn"
                    onClick={() => {
                      handleUseTemplate(previewTemplate.id);
                      closePreview();
                    }}
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="checkout-button" onClick={() => navigate('/templates')}>
        Checkout Presentation Templates
      </button>
    </div>
  );
};

export default TemplateSelector; 