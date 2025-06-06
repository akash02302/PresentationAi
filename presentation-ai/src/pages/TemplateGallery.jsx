import React, { useState } from 'react';
import '../styles/TemplateGallery.css';

const allTemplates = [
  {
    id: 'think-outside',
    name: 'Think Outside the Box',
    thumbnail: '/templates/minimal/thumbnail.png',
    templateFile: '/templates/minimal/template.pptx',
    description: 'Creative Problem-Solving for Innovators',
    category: 'Business'
  },
  {
    id: 'mirror-gram',
    name: 'Mirror, Mirror on the Gram',
    thumbnail: '/templates/modern/thumbnail.png',
    templateFile: '/templates/modern/template.pptx',
    description: 'The Psychological Impact of Filters',
    category: 'Business'
  },
  {
    id: 'digital-domination',
    name: 'Digital Domination',
    thumbnail: '/templates/creative/thumbnail.png',
    templateFile: '/templates/creative/template.pptx',
    description: 'Rise of Social Media',
    category: 'Social Media'
  },
  // Add more templates
  {
    id: 'corporate-modern',
    name: 'Introduction To Thermodynamics',
    thumbnail: '/templates/education/thumbnail.png',
    templateFile: '/templates/education/template.pptx',
    description: 'Unveiling the Mysteries of Thermodynamics',
    category: 'Education'
  },
  {
    id: 'startup-pitch',
    name: 'Intoduction to Thermodynamics',
    thumbnail: '/templates/education/thumbnail2.png',
    templateFile: '/templates/education/template2.pptx',
    description: 'Unveiling the Secrets of Thermodynamics',
    category: 'Social Media'
  },
  {
    id: 'marketing-pitch',
    name: 'Presentation-Ai',
    thumbnail: '/templates/marketing/thumbnail.png',
    templateFile: '/templates/marketing/template.pptx',
    description: 'Creating Presentations with AI',
    category: 'Marketing'
  },
  {
    id: 'education-pitch',
    name: 'Presnation made easy',
    thumbnail: '/templates/marketing/thumbnail2.png',
    templateFile: '/templates/marketing/template2.pptx',
    description: 'The Enigmatic Atlantic Ocean',
    category: 'Marketing'
  }
];

const templateSlides = {
  'think-outside': [
    '/templates/minimal/slide1.png',
    '/templates/minimal/slide2.png',
    '/templates/minimal/slide3.png',
    '/templates/minimal/slide4.png'
  ],
  'mirror-gram': [
    '/templates/modern/slide1.png',
    '/templates/modern/slide2.png',
    '/templates/modern/slide3.png',
    '/templates/modern/slide4.png'
  ],
  'digital-domination': [
    '/templates/creative/slide1.png',
    '/templates/creative/slide2.png',
    '/templates/creative/slide3.png',
    '/templates/creative/slide4.png'
  ],
  'corporate-modern': [
    '/templates/education/slide1.png',
    '/templates/education/slide2.png',
    '/templates/education/slide3.png',
    '/templates/education/slide4.png'
  ],
  'startup-pitch': [
    '/templates/education/slide5.png',
    '/templates/education/slide6.png',
    '/templates/education/slide7.png',
    '/templates/education/slide8.png'
  ],
  'marketing-pitch': [
    '/templates/marketing/slide1.png',
    '/templates/marketing/slide2.png',
    '/templates/marketing/slide3.png',
    '/templates/marketing/slide4.png'
  ],
  'education-pitch': [
    '/templates/marketing/slide5.png',
    '/templates/marketing/slide6.png',
    '/templates/marketing/slide7.png',
    '/templates/marketing/slide8.png'
  ]
};

const TemplateGallery = () => {
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = selectedCategory === 'All' 
    ? allTemplates
    : allTemplates.filter(template => template.category === selectedCategory);

  const handlePreview = (template) => {
    setPreviewTemplate(template);
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

  const handleKeyPress = (e) => {
    if (previewTemplate) {
      if (e.key === 'ArrowRight') {
        nextSlide(e);
      } else if (e.key === 'ArrowLeft') {
        prevSlide(e);
      } else if (e.key === 'Escape') {
        closePreview();
      }
    }
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  // Add keyboard navigation
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [previewTemplate, currentSlide]);

  return (
    <div className="template-gallery">
      <header className="gallery-header">
        <h1>Presentation Templates</h1>
        <p>Choose from our collection of professional templates</p>
      </header>

      <div className="gallery-filters">
        <button 
          className={`filter-button ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All
        </button>
        {['Business', 'Marketing', 'Social Media', 'Education'].map(category => (
          <button
            key={category}
            className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="templates-grid">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="template-card">
            <div className="template-preview">
              <img 
                src={template.thumbnail} 
                alt={template.name} 
              />
              <div className="template-overlay">
                <button className="use-template-btn">Use Template</button>
                <button 
                  className="preview-btn"
                  onClick={() => handlePreview(template)}
                >
                  Preview
                </button>
              </div>
            </div>
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <span className="category-tag">{template.category}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Updated Preview Modal */}
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

              <div className="preview-thumbnails">
                {templateSlides[previewTemplate.id]?.map((slide, index) => (
                  <div 
                    key={index}
                    className={`thumbnail ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  >
                    <img src={slide} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>

              <div className="preview-details">
                <p>{previewTemplate.description}</p>
                <span className="category-tag">{previewTemplate.category}</span>
                <div className="preview-actions">
                  <button className="use-template-btn">Use This Template</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery; 