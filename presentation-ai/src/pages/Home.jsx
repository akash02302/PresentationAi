import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import InputForm from '../components/InputForm'
import SlidesViewer from '../components/SlidesViewer'
import '../styles/Home.css'
import '../styles/SlidesViewer.css'
import { VideoProcessor } from '../services/VideoProcessor'
import { toast } from 'react-hot-toast'

function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [videoFile, setVideoFile] = useState(null)
  const [generatedSlides, setGeneratedSlides] = useState(null)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSubmit = async (inputData) => {
    setIsProcessing(true)
    try {
      const processor = new VideoProcessor()
      let slides

      if (inputData.document) {
        console.log('Processing document:', inputData.document)
        slides = await processor.processContent(inputData.document)
      } else if (inputData.text) {
        console.log('Processing text input:', inputData.text)
        slides = await processor.processContent(inputData.text)
      } else if (inputData.youtubeUrl) {
        console.log('Processing YouTube URL:', inputData.youtubeUrl)
        slides = await processor.processContent(inputData.youtubeUrl)
      } else {
        console.log('No input provided')
        toast.error('Please provide input content')
        return
      }

      console.log('Received slides response:', slides)

      if (slides && slides.success && slides.slides) {
        setGeneratedSlides(slides.slides)
        toast.success('Slides generated successfully!')
      } else {
        console.error('Invalid slides response:', slides)
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
      
      <div className="input-section">
        <InputForm onSubmit={handleSubmit} isProcessing={isProcessing} />
      </div>

      {generatedSlides && (
        <div className="slides-section">
          <SlidesViewer slides={generatedSlides} />
        </div>
      )}
    </div>
  )
}

export default Home 