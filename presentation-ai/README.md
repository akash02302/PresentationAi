# PresentationAI Frontend

A React-based web application that generates professional presentations from various content sources using AI.

## Features

- **Multi-Source Input**
  - YouTube Video URLs
  - Text Content
  - Document Upload (PDF, DOCX, TXT)

- **Authentication**
  - Email/Password Login
  - Google Sign-in
  - Secure Authentication using Firebase

- **AI-Powered Generation**
  - Automatic Slide Creation
  - Content Summarization
  - Smart Content Organization
  - Professional Formatting

## Tech Stack

- **Framework**: React + Vite
- **UI Libraries**: 
  - React Icons
  - React Hot Toast
  - PptxGenJS
- **Authentication**: Firebase Auth
- **Styling**: Custom CSS with Modern Design

## Getting Started

1. **Clone the repository**
git clone <repository-url>
cd presentation-ai


2. **Install dependencies**
npm install

3. **Environment Setup**
Create a `.env` file in the root directory:

env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

4. **Start Development Server**
npm run dev

5.  **Project Structure**
src/
├── assets/ # Static assets
├── components/ # Reusable components
├── pages/ # Page components
├── services/ # API and service functions
├── styles/ # CSS files
├── firebase/ # Firebase configuration
└── App.jsx # Main application component


## Key Components

- **Login/SignUp**: User authentication
- **Home**: Main presentation generation interface
- **InputForm**: Handles various input types
- **SlidesViewer**: Displays and exports presentations
- **Navbar**: Navigation and user controls

## Features in Detail

### Authentication
- Secure login/signup with email
- Google OAuth integration
- Password reset functionality

### Content Processing
- YouTube video processing
- Text content structuring
- Document parsing and analysis

### Presentation Generation
- Automatic slide creation
- Content organization
- Professional formatting
- PowerPoint export

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for authentication
- PptxGenJS for presentation generation
- React community for excellent tools and libraries

