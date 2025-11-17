# Voice Keyboard - AI-Powered Dictation App

A full-stack web application that converts voice into well-formatted text using AI-powered transcription with Deepgram and intelligent text cleanup with Groq LLM.

## Features

- **User Authentication**: Secure email/password authentication with NextAuth.js
- **Real-time Voice Transcription**: Record audio and get instant AI-powered transcription
- **Audio Slicing**: Smart 5-second audio slicing for optimal performance and low latency
- **Transcription History**: View, copy, and manage all your past transcriptions
- **Custom Dictionary**: Add custom words and spellings for improved accuracy
- **Modern UI**: Clean, responsive design built with ShadCN UI components
- **Copy to Clipboard**: One-click copy functionality for all transcriptions

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **ShadCN UI** - Modern, accessible component library
- **NextAuth.js** - Authentication solution

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **TypeORM** - Database ORM
- **PostgreSQL** - Database
- **Deepgram** - AI transcription engine (Nova-2 model)
- **Groq LLM** - Text cleanup and formatting (Llama 3.3 70B)

### Hosting
- **Railway** - Deployment platform for both app and database

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Deepgram API key
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pov
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=voice_keyboard

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Deepgram API (for transcription)
DEEPGRAM_API_KEY=your-deepgram-api-key

# Groq API (for LLM text cleanup)
GROQ_API_KEY=your-groq-api-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application uses TypeORM with automatic synchronization in development mode. On first run, it will automatically create all required tables:

- `users` - User accounts
- `transcriptions` - Saved transcriptions
- `dictionary` - Custom word dictionary

## Deployment to Railway

### Option 1: Using Railway CLI

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Add PostgreSQL database:
```bash
railway add
# Select PostgreSQL
```

5. Set environment variables:
```bash
railway variables set NEXTAUTH_SECRET="your-secret-key"
railway variables set DEEPGRAM_API_KEY="your-deepgram-key"
railway variables set GROQ_API_KEY="your-groq-key"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
```

6. Deploy:
```bash
railway up
```

### Option 2: Using Railway Dashboard

1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL database from template
4. Deploy from GitHub repository
5. Add environment variables in the project settings
6. Railway will automatically detect Next.js and deploy

### Required Environment Variables for Production

```env
DATABASE_HOST=<from-railway-postgres>
DATABASE_PORT=<from-railway-postgres>
DATABASE_USER=<from-railway-postgres>
DATABASE_PASSWORD=<from-railway-postgres>
DATABASE_NAME=<from-railway-postgres>
NEXTAUTH_SECRET=<generate-secure-random-string>
NEXTAUTH_URL=<your-railway-app-url>
DEEPGRAM_API_KEY=<your-deepgram-api-key>
GROQ_API_KEY=<your-groq-api-key>
NODE_ENV=production
```

## How It Works

### Audio Slicing Technology

The app uses an innovative audio slicing approach:

1. **Continuous Recording**: User starts recording with a single click
2. **5-Second Slices**: Audio is automatically split into 5-second chunks
3. **Real-time Processing**: Each slice is sent to Deepgram for transcription
4. **Intelligent Merging**: Transcribed text is merged progressively
5. **AI Cleanup**: Merged text is sent to Groq LLM for grammar correction and cleanup
6. **Low Latency**: Maximum delay is just the processing time of the final 5-second slice

### Custom Dictionary Integration

When transcribing, the app:
1. Fetches user's custom dictionary entries
2. Includes them as keywords in the Deepgram API
3. Passes custom spellings to Groq LLM for proper formatting
4. Ensures correct spelling of technical terms, names, etc.

### AI-Powered Text Cleanup

After transcription, Groq LLM enhances the text by:
1. Fixing grammatical errors
2. Improving punctuation and formatting
3. Removing filler words (um, uh, like, you know)
4. Ensuring proper capitalization
5. Maintaining original meaning and tone
6. Respecting custom dictionary spellings

## Project Structure

```
pov/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── transcribe/    # Transcription endpoint
│   │   ├── transcriptions/ # Transcription CRUD
│   │   └── dictionary/    # Dictionary CRUD
│   ├── auth/              # Auth pages (signin/signup)
│   ├── dashboard/         # Main app pages
│   │   ├── dictionary/    # Dictionary management
│   │   └── settings/      # Settings page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page with redirect
├── components/
│   ├── ui/                # ShadCN UI components
│   ├── app-sidebar.tsx    # Navigation sidebar
│   └── providers.tsx      # Client providers
├── entities/              # TypeORM entities
│   ├── User.ts
│   ├── Transcription.ts
│   └── Dictionary.ts
├── hooks/
│   └── use-audio-recorder.ts  # Audio recording hook
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Database connection
│   └── utils.ts           # Utility functions
└── types/
    └── next-auth.d.ts     # TypeScript declarations
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in (via NextAuth)
- `POST /api/auth/signout` - Sign out (via NextAuth)

### Transcription
- `POST /api/transcribe` - Transcribe audio file
- `GET /api/transcriptions` - Get user's transcriptions
- `DELETE /api/transcriptions?id=<id>` - Delete transcription

### Dictionary
- `GET /api/dictionary` - Get dictionary entries
- `POST /api/dictionary` - Create entry
- `PUT /api/dictionary` - Update entry
- `DELETE /api/dictionary?id=<id>` - Delete entry

## Performance Optimization

- Audio slicing reduces latency to ~5 seconds maximum
- TypeORM connection pooling for database performance
- Next.js static optimization where possible
- Efficient React hooks prevent unnecessary re-renders
- Optimistic UI updates for better UX

## Security Features

- Password hashing with bcrypt
- JWT-based session management
- CSRF protection via NextAuth
- SQL injection prevention via TypeORM
- Environment variable protection

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires microphone access permission

## License

MIT License - feel free to use this project for your own purposes.
