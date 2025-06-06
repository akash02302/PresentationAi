import { useState } from 'react'
import InputForm from '../components/InputForm'
import SlidesViewer from '../components/SlidesViewer'
import '../styles/Home.css'
import '../styles/SlidesViewer.css'
import { VideoProcessor } from '../services/VideoProcessor'
import { toast } from 'react-hot-toast'
import TemplateSelector from '../components/TemplateSelector'

function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [videoFile, setVideoFile] = useState(null)
  const [generatedSlides, setGeneratedSlides] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState({ 
    id: 'modern',
    templateFile: '/templates/modern/template.pptx' 
  })

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setGeneratedSlides(null)
  }

  const handleSubmit = async (inputData) => {
    setIsProcessing(true)
    try {
      const processor = new VideoProcessor()
      
      // Add template to the input data
      const processData = {
        ...inputData,
        template: selectedTemplate.id,
        templateFile: selectedTemplate.templateFile
      }
      
      console.log('Processing with template:', selectedTemplate)
      const result = await processor.processContent(processData)

      if (result && result.success && result.slides) {
        const slidesWithTemplate = result.slides.map(slide => ({
          ...slide,
          template: selectedTemplate.id,
          templateFile: selectedTemplate.templateFile
        }))
        
        setGeneratedSlides(slidesWithTemplate)
        toast.success('Slides generated successfully!')
      } else {
        console.error('Invalid slides response:', result)
        toast.error('Failed to generate slides: Invalid response format')
      }
    } catch (error) {
      console.error('Error processing:', error)
      toast.error(`Failed to generate slides: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVideoUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setVideoFile(file)
    }
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Transform Content into Presentations</h1>
        <p>Generate professional presentations from videos, text, or documents in seconds</p>
      </div>
      
      <div className="input-section" id="input-section">
        <InputForm onSubmit={handleSubmit} isProcessing={isProcessing} />
      </div>

      {generatedSlides && (
        <div className="slides-section">
          <SlidesViewer 
            slides={generatedSlides} 
            template={selectedTemplate.id} 
          />
        </div>
      )}

      <div className="workflow-section">
        <h2>How It Works</h2>
        <div className="workflow-diagram">
          <div className="input-types">
            <div className="input-type">
              <img src="/icons/pdf.png" alt="PDF" />
              <span>PDF</span>
            </div>
            <div className="input-type">
              <img src="/icons/text.png" alt="Text" />
              <span>Text</span>
            </div>
            <div className="input-type">
              <img src="/icons/youtube.png" alt="YouTube" />
              <span>YouTube</span>
            </div>
            <div className="input-type">
              <img src="/icons/docx.png" alt="DOCX" />
              <span>DOCX</span>
            </div>
          </div>
          <div className="arrow">→</div>
          <div className="magic-slides">
            <img src="/icons/magic-slide.png" alt="MagicSlides" />
            <span>PresentationAi</span>
          </div>
          <div className="arrow">→</div>
          <div className="output-types">
            <div className="output-type">
              <img src="/icons/powerpoint.png" alt="PowerPoint" />
              <span>PowerPoint</span>
            </div>
            <div className="output-type">
              <img src="/icons/google-slide.png" alt="Google Slides" />
              <span>Google Slides</span>
            </div>
          </div>
        </div>
      </div>

      <div className="template-section">
        <TemplateSelector 
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
        />
      </div>
    </div>
  )
}

export default Home 