# StreamScene 🎬

<p align="center">
  <img src="https://img.shields.io/badge/Project%20by-Project%20Visi0n-purple?style=for-the-badge" alt="Project Visi0n" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" alt="React" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="TypeScript" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original-wordmark.svg" alt="Node.js" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original-wordmark.svg" alt="Express" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mysql/mysql-original-wordmark.svg" alt="MySQL" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="AWS" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/google/google-original.svg" alt="Google" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/sequelize/sequelize-original.svg" alt="Sequelize" width="40" height="40"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/webpack/webpack-original.svg" alt="Webpack" width="40" height="40"/>
</p>

**Your complete creative production platform for streamlined workflows**

StreamScene is a modern, full-stack web application designed for content creators, streamers, and media professionals. It provides an integrated suite of tools for project management, file organization, content scheduling, and collaborative workflows.

## ✨ Features

### 🔐 Authentication & User Management
- **Google OAuth 2.0 Integration**: Secure authentication with Google accounts
- **Session Management**: Persistent login sessions with Express sessions
- **User Profiles**: Personalized experience with profile pictures and user data

### 📁 Project Center & File Management
- **Drag & Drop File Upload**: Intuitive file upload with progress tracking
- **AWS S3 Integration**: Secure cloud storage with automatic fallback to local storage
- **File Tagging System**: Organize files with custom tags for easy discovery
- **File Sharing**: Generate shareable links for collaboration
- **Multi-format Support**: Videos, audio, images, documents (PDF, DOC, DOCX)
- **Real-time Preview**: Instant file previews with thumbnails

### 🎨 Creative Tools
- **Project Center Canvas**: Interactive canvas for visual project planning
- **Drawing Integration**: Create and save sketches directly in the platform
- **File Organization**: Advanced filtering and search capabilities

### 🤖 AI-Powered Features
- **AI Weekly Planner**: Generate content schedules with Google Gemini AI
- **Task Generation**: AI-assisted task creation and planning
- **Smart Suggestions**: AI-powered content recommendations

### 📅 Content Scheduling
- **Multi-platform Support**: Schedule content for YouTube, Twitch, Twitter, Instagram, TikTok
- **Calendar Integration**: Visual scheduling interface
- **Project Linking**: Connect files and drawings to scheduled content
- **Status Tracking**: Monitor content from draft to published

### 🎯 Task Management
- **Creative & Administrative Tasks**: Categorized task management
- **Priority Levels**: High, medium, low priority organization
- **Deadline Tracking**: Due date management and notifications
- **Progress Monitoring**: Track task completion status

## 🛠️ Technology Stack

### Frontend
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12.x-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-7.x-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)

- **React 19** with TypeScript
- **Framer Motion** for animations and interactions
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Sketch Canvas** for drawing functionality

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Passport.js](https://img.shields.io/badge/Passport.js-0.7-34E27A?style=for-the-badge&logo=passport&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-6.x-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

- **Node.js** with Express.js
- **TypeScript** for type safety
- **Passport.js** for authentication
- **Sequelize** ORM (with MySQL fallback)
- **Google Generative AI** integration
- **AWS S3** for file storage

### Cloud & Services
![AWS S3](https://img.shields.io/badge/AWS%20S3-Storage-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)
![Google AI](https://img.shields.io/badge/Google%20AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google%20OAuth-2.0-4285F4?style=for-the-badge&logo=google&logoColor=white)

### Development & Build Tools
![Webpack](https://img.shields.io/badge/Webpack-5.x-8DD6F9?style=for-the-badge&logo=webpack&logoColor=black)
![PostCSS](https://img.shields.io/badge/PostCSS-8.x-DD3A0A?style=for-the-badge&logo=postcss&logoColor=white)
- **PostCSS** with Tailwind
- **TSX** for TypeScript execution
### Prerequisites
- Node.js 18+ and npm
### Installation

1. **Clone the repository**
```bash
git clone https://github.com/theblkguy/stream-scene.git
cd stream-scene
```


2. **Create your .env file**
```env
# Server Configuration
PORT=8000

# Database Configuration
DB_HOST=localhost
DB_NAME=example_db
DB_USER=example_user
DB_PASS=example_password

# Production Database Configuration (for EC2)
# DB_HOST=example-ec2-host
# DB_NAME=example_db
# DB_USER=example_user
# DB_PASS=example_password

# Google OAuth
GOOGLE_CLIENT_ID=fake-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=fake-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback
SESSION_SECRET=example-session-secret

# AWS S3
AWS_ACCESS_KEY_ID=FAKEAWSACCESSKEYID
AWS_SECRET_ACCESS_KEY=FAKEAWSSECRETACCESSKEY
AWS_REGION=us-east-2
AWS_S3_BUCKET=example-s3-bucket

# AI Features
GEMINI_API_KEY=fake-gemini-api-key

# Feature Flags
USE_MOCK_X_API=true
```


The application will be available at:
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:8000/api

### Production Build

```bash
npm run build
npm start
```

## 📖 API Documentation

### Authentication Endpoints
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/user` - Get current user
- `POST /auth/logout` - Logout user

### File Management
- `GET /api/files` - Get user files (supports `?tags=tag1,tag2` filter)
- `POST /api/files` - Create file record
- `GET /api/files/:id` - Get specific file
- `PUT /api/files/:id` - Update file metadata and tags
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/tags/list` - Get user's tags

### File Sharing
- `POST /api/shares` - Create shareable link
- `GET /api/shares/:shareId` - Access shared file
- `GET /api/shares/file/:shareId` - Get shared file details

### Tasks
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### AI Features
- `POST /api/ai/generate-tasks` - Generate tasks with AI
- `POST /api/ai/suggestions` - Get AI content suggestions

### Content Scheduling
- `GET /api/schedule` - Get scheduled content
- `POST /api/schedule` - Create scheduled post
- `PUT /api/schedule/:id` - Update scheduled post
- `DELETE /api/schedule/:id` - Delete scheduled post

## 📁 Project Structure

```
stream-scene/
├── client/                     # Frontend React application
│   ├── components/            # React components
│   │   ├── ProjectCenter/     # File management components
│   │   ├── GoogleLoginButton.tsx
│   │   ├── NavBar.tsx
│   │   └── ...
│   ├── ContentScheduler/      # Content scheduling module
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API service layers
│   ├── shared/               # Shared utilities and types
│   ├── styles/               # Styling files
│   └── types/                # TypeScript type definitions
├── server/                   # Backend Express application
│   ├── config/              # Configuration files
│   ├── db/                  # Database setup and connection
│   ├── middleware/          # Express middleware
│   ├── models/              # Data models
│   ├── routes/              # API route handlers
│   └── types/               # Backend type definitions
├── public/                  # Static assets
├── webpack.config.mjs       # Webpack configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

## 🎯 Key Features Deep Dive

### File Tagging System
- **Dynamic Tag Creation**: Add tags during upload or edit existing files
- **Tag-based Filtering**: Filter files by multiple tags
- **Auto-completion**: Tag suggestions based on existing tags
- **Collaborative Tagging**: Shared tags across team projects

### Project Center Canvas
- **Interactive Drawing**: Create visual project plans and workflows
- **File Integration**: Link uploaded files to canvas elements
- **Collaborative Editing**: Real-time collaboration features
- **Export Options**: Save and share canvas creations

### AI-Powered Content Planning
- **Smart Scheduling**: AI suggests optimal posting times
- **Content Analysis**: Extract insights from uploaded files
- **Task Generation**: Automatically create tasks from project requirements
- **Trend Integration**: AI-powered content trend analysis

## 🔧 Configuration Options

### File Upload Settings
- **Supported Formats**: Video (MP4, AVI, MOV), Audio (MP3, WAV), Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX)
- **Size Limits**: Configurable per file type
- **Storage Options**: AWS S3 or local storage
- **Progress Tracking**: Real-time upload progress

### Security Features
- **CORS Protection**: Configurable origin restrictions
- **Session Security**: Secure session management
- **File Access Control**: User-based file permissions
- **OAuth Integration**: Secure Google authentication

## 🚦 Development Guidelines

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with recommended rules
- **Prettier**: Code formatting automation
- **Component Structure**: Functional components with hooks

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Building for Production
```bash
# Build client and server
npm run build

# Start production server
npm start
```

## 📊 Monitoring & Analytics

### Built-in Logging
- **Request Logging**: All API requests logged
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time monitoring
- **User Activity**: Authentication and file access logs

### Health Checks
- **Database Status**: Connection health monitoring
- **S3 Connectivity**: Storage service health checks
- **API Availability**: Endpoint status monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Install dependencies
npm install

# Start development servers
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
npm run dev          # Both frontend and backend
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Authentication not working:**
- Verify Google OAuth credentials in `.env`
- Check callback URL configuration
- Ensure session secret is set

**File uploads failing:**
- Check AWS S3 credentials and bucket permissions
- Verify file size limits
- Check network connectivity

**Database connection issues:**
- Verify MySQL credentials and connection
- Check if database exists
- Application will fallback to in-memory storage

### Getting Help
- 📧 **Email**: support@streamscene.app
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/theblkguy/stream-scene/issues)
- 📚 **Documentation**: [Wiki](https://github.com/theblkguy/stream-scene/wiki)

## 🔮 Roadmap

- [ ] **Mobile App**: React Native mobile application
- [ ] **Real-time Collaboration**: WebSocket-based real-time features
- [ ] **Advanced Analytics**: Detailed usage and performance analytics
- [ ] **Plugin System**: Extensible plugin architecture
- [ ] **Multi-language Support**: Internationalization
- [ ] **Advanced AI Features**: Enhanced content generation and analysis

---

**StreamScene** - Streamlining creative workflows, one project at a time. 🎬✨# Deployment test - Fri Aug 15 00:16:48 CDT 2025
