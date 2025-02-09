import { useState } from 'react'
import '../styles/InputForm.css'
import { toast } from 'react-hot-toast'

const InputForm = ({ onSubmit, isProcessing }) => {
  const [inputType, setInputType] = useState('youtube')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [text, setText] = useState('')
  const [document, setDocument] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    switch (inputType) {
      case 'youtube':
        onSubmit({ youtubeUrl })
        break
      case 'text':
        if (text.trim()) {
          onSubmit({ text: text.trim() })
        } else {
          toast.error('Please enter some text')
        }
        break
      case 'document':
        onSubmit({ document })
        break
      default:
        break
    }
  }

  const handleDocumentUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocument(file)
    }
  }

  return (
    <div className="input-form">
      <div className="input-type-selector">
        <button 
          className={inputType === 'youtube' ? 'active' : ''}
          type="button"
          onClick={() => setInputType('youtube')}
        >
          YouTube Link
        </button>
        <button 
          className={inputType === 'text' ? 'active' : ''}
          type="button"
          onClick={() => setInputType('text')}
        >
          Text
        </button>
        <button 
          className={inputType === 'document' ? 'active' : ''}
          type="button"
          onClick={() => setInputType('document')}
        >
          Document
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {inputType === 'youtube' && (
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Paste YouTube URL here"
            className="input-field"
          />
        )}

        {inputType === 'text' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter or paste your text here"
            className="input-field text-area"
            rows={6}
          />
        )}

        {inputType === 'document' && (
          <div className="document-upload">
            <input
              type="file"
              onChange={handleDocumentUpload}
              accept=".doc,.docx,.pdf,.txt"
              id="document-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="document-input" className="document-label">
              {document ? document.name : 'Choose a document'}
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing}
          className="submit-button"
        >
          {isProcessing ? 'Generating...' : 'Generate Slides'}
        </button>
      </form>
    </div>
  )
}

export default InputForm
