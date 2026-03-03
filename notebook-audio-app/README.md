# Notebook-Style Audio Overview App

A comprehensive React Native (Expo) mobile app with NestJS backend for creating AI-powered audio overviews from your documents, web sources, and more.

## Features

- **Sources Management**: Add PDFs, audio, images, websites, YouTube videos, and copied text
- **AI Chat**: RAG-powered chat with your sources
- **Studio**: Generate audio overviews, video overviews, flashcards, quizzes, infographics, and slide decks
- **Audio Player**: Full-featured player with waveform visualization, speed control, and download
- **Dark Theme**: Beautiful dark UI with accent colors

## Tech Stack

### Mobile (Expo React Native)
- React Native with TypeScript
- React Navigation (Bottom Tabs + Stack)
- React Native Paper (UI components)
- TanStack Query (React Query for data fetching)
- Zustand (State management)
- React Native Track Player (Audio playback)
- React Native SVG + Reanimated (Waveform visualization)

### Backend (NestJS)
- NestJS with TypeScript
- Prisma ORM with PostgreSQL
- BullMQ with Redis (Job queues)
- OpenAI API (Embeddings, Chat, TTS)
- MinIO/S3 (File storage)

## Project Structure

```
notebook-audio-app/
├── apps/
│   ├── mobile/          # Expo React Native app
│   │   ├── src/
│   │   │   ├── screens/     # All screen components
│   │   │   ├── navigation/  # Navigation configuration
│   │   │   ├── components/  # Reusable components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── stores/      # Zustand state stores
│   │   │   ├── theme/       # Theme configuration
│   │   │   └── api/         # API client
│   │   └── App.tsx
│   └── api/             # NestJS backend
│       ├── src/
│       │   ├── auth/        # Authentication
│       │   ├── projects/    # Projects API
│       │   ├── sources/     # Sources ingestion
│       │   ├── chat/        # Chat with RAG
│       │   ├── generations/ # Content generation
│       │   ├── ai/          # AI services (TTS, embeddings)
│       │   ├── queue/       # BullMQ queue setup
│       │   └── storage/     # S3/MinIO storage
│       └── main.ts
├── packages/
│   └── shared/          # Shared types and schemas
│       └── src/
│           ├── schemas.ts   # Zod schemas
│           └── types.ts     # TypeScript types
└── infra/
    ├── docker-compose.yml   # Postgres, Redis, MinIO
    └── prisma/
        └── schema.prisma    # Database schema
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Docker & Docker Compose
- OpenAI API key

### 1. Clone and Install

```bash
cd notebook-audio-app
pnpm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example env file
cp apps/api/.env.example apps/api/.env

# Edit apps/api/.env and add your OpenAI API key
OPENAI_API_KEY=sk-your-openai-api-key
```

### 3. Start Infrastructure Services

```bash
pnpm db:up
```

This starts PostgreSQL, Redis, and MinIO.

### 4. Set Up Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

### 5. Start the API

```bash
pnpm dev
```

The API will be available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api`

### 6. Start the Mobile App

```bash
# In a new terminal
pnpm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## API Endpoints

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `GET /projects/:id/sources` - Get project sources
- `GET /projects/:id/generations` - Get project generations
- `GET /projects/:id/messages` - Get project chat history

### Sources
- `POST /sources/pdf` - Upload PDF
- `POST /sources/audio` - Upload audio file
- `POST /sources/image` - Upload image
- `POST /sources/url` - Add website URL
- `POST /sources/youtube` - Add YouTube video
- `POST /sources/text` - Add copied text
- `GET /sources/search/web?q=...` - Search web

### Chat
- `POST /chat` - Send message
- `GET /chat/history/:projectId` - Get chat history

### Generations
- `POST /generations` - Create generation
- `GET /generations/:id` - Get generation
- `POST /generations/:id/rate` - Rate generation
- `POST /generations/:id/regenerate` - Regenerate variant

## AI Pipeline

### 1. Source Ingestion
- PDF text extraction using `pdf-parse`
- URL content extraction with Cheerio
- YouTube transcript extraction (placeholder)
- Text chunking (800-1200 tokens with overlap)

### 2. RAG (Retrieval Augmented Generation)
- OpenAI embeddings (`text-embedding-3-small`)
- Cosine similarity search for relevant chunks
- Context-aware chat responses

### 3. TTS (Text-to-Speech)
- **Primary**: OpenAI TTS (`tts-1`)
- **Optional**: ElevenLabs, Azure Speech adapters
- **Fallback**: Piper (local TTS)
- Dialogue synthesis with two voices (Host A & B)

### 4. Content Generation
- **Audio Overview**: Two-host podcast-style discussion
- **Video Overview**: Storyboard with narration
- **Flashcards**: Q&A study cards
- **Quiz**: Multiple choice questions
- **Infographic**: Visual summary
- **Slide Deck**: Presentation slides

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_HOST` | Redis hostname | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (optional) | - |
| `AZURE_SPEECH_KEY` | Azure Speech key (optional) | - |
| `S3_ENDPOINT` | S3/MinIO endpoint | http://localhost:9000 |
| `S3_BUCKET` | S3 bucket name | notebook |
| `TTS_DEFAULT_PROVIDER` | Default TTS provider | openai |

## Development

### Running Tests

```bash
# API tests
cd apps/api
pnpm test

# Mobile linting
cd apps/mobile
pnpm lint
```

### Database Migrations

```bash
# Create new migration
pnpm --filter api prisma:migrate -- --name migration_name

# Reset database
pnpm --filter api prisma:migrate -- reset
```

### Queue Monitoring

BullMQ UI is available when running with monitoring profile:

```bash
docker compose -f infra/docker-compose.yml --profile monitoring up
```

Access at `http://localhost:3001`

## Mobile UI Components

### Theme Colors
- Background: `#111316`
- Card: `#1A1D22`
- Text: `#EAECEF`
- Muted: `#9AA3AE`
- Accent Blue: `#3B5BFF`
- Accent Green: `#3CFF8F`

### Screens
- **SourcesList**: List sources with floating "Add" button
- **AddSourceSheet**: Modal for adding new sources
- **ChatScreen**: Chat interface with message bubbles
- **StudioScreen**: Generation tiles and media list
- **PlayerScreen**: Audio player with waveform
- **GenerationDetailScreen**: View flashcards, quiz, etc.

## Production Deployment

### Backend
1. Set up PostgreSQL database
2. Set up Redis instance
3. Configure S3-compatible storage
4. Set environment variables
5. Run `pnpm build` and `pnpm start:prod`

### Mobile
1. Configure API URL in `api/client.ts`
2. Build with EAS: `eas build`
3. Submit to App Store / Play Store

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Common Issues

**Mobile can't connect to API**
- Ensure API is running on accessible host
- Update `API_BASE_URL` in `apps/mobile/src/api/client.ts`
- For physical devices, use your computer's IP address

**TTS not working**
- Verify `OPENAI_API_KEY` is set correctly
- Check API logs for errors

**Database connection errors**
- Ensure PostgreSQL is running: `docker ps`
- Verify `DATABASE_URL` in `.env`

**File uploads failing**
- Ensure MinIO is running
- Check S3 credentials in `.env`
