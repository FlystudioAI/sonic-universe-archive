# CTRL/news — The AI-Powered News & Podcast Experience

**CTRL/news** is a sleek, intelligent, and fully automated news platform that aggregates real-time headlines about Generative AI in media, summarizes them using GPT-4o, and delivers a daily AI-generated podcast with multiple synthetic voices.

## 🚀 Features

### 🔗 Real-Time News Aggregation
- Pull up-to-the-minute GenAI-related headlines from multiple sources
- Primary source: Newsdata.io with GNews & ContextualWeb as fallbacks
- Filter by topics, regions, and credibility scores
- Refresh every 30–60 minutes with top 50 stories stored daily

### ✍️ AI Summarization & Curation
- Generate 30–50 word engaging summaries using GPT-4o
- Tone analysis and automatic CTAs
- Scoring logic based on recency, credibility, and engagement

### 🎙️ Daily Multi-Host Podcast (CTRLcast)
- Automated 8–10 minute daily podcast from top 10 stories
- Three distinct AI hosts with ElevenLabs voices:
  - **CTRL/Alex**: Calm, objective, analytical
  - **CTRL/Sam**: Curious, inquisitive, drives conversation
  - **CTRL/Jae**: Witty, entertaining, adds personality
- GPT-4o script generation → ElevenLabs TTS → audio stitching

### 🐦 X.com "CTRL/Top Tweets"
- Pull top 10 GenAI tweets daily from AI influencers
- AI-generated summaries for each tweet
- Social signals and engagement tracking

### 👤 Personalization & User Management
- Firebase Authentication with Google OAuth
- User interest onboarding and behavior tracking
- Personalized feed and podcast recommendations
- Saved articles and reading history

### 💸 Freemium Monetization
- **Free**: 10 stories/day, 3 podcasts/week, with ads
- **Premium ($9.99/mo)**: Unlimited access, no ads, custom podcast generation

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Authentication & Database**: Firebase Auth + Firestore
- **AI Model**: GPT-4o (OpenAI API)
- **Voice TTS**: ElevenLabs (multi-voice support)
- **Audio Processing**: AudioCraft/FFmpeg for stitching
- **News APIs**: Newsdata.io (primary), GNews & ContextualWeb (fallbacks)
- **Social Media**: Twitter/X API v2
- **Email**: Resend + React Email
- **Payments**: Stripe integration
- **Deployment**: Vite build system

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- API keys for the required services (see `.env.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ctrl-news
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your API keys in `.env`:
   - OpenAI API key for GPT-4o
   - ElevenLabs API key for TTS
   - Firebase configuration
   - News API keys (Newsdata.io, GNews, ContextualWeb)
   - Twitter Bearer Token
   - Resend API key for emails
   - Stripe publishable key

4. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication and Firestore
   - Add your Firebase config to `.env`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit** `http://localhost:5173`

## 📁 Project Structure

```
src/
├── auth/              # Authentication services
├── newsFetcher/       # News aggregation logic
├── podcastGenerator/  # Podcast creation with TTS
├── summarizer/        # AI summarization services
├── twitterFeed/       # X.com integration
├── personalization/   # User behavior tracking
├── types/             # TypeScript interfaces
├── components/        # React components
│   ├── layout/        # Layout components
│   └── ui/            # shadcn/ui components
├── pages/             # Main application pages
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
└── providers/         # React context providers
```

## 🔑 Required API Keys

1. **OpenAI**: Get API key from https://platform.openai.com/api-keys
2. **ElevenLabs**: Get API key from https://elevenlabs.io/
3. **Firebase**: Create project at https://console.firebase.google.com
4. **Newsdata.io**: Get API key from https://newsdata.io/
5. **Twitter**: Get Bearer Token from https://developer.twitter.com/
6. **Resend**: Get API key from https://resend.com/
7. **Stripe**: Get publishable key from https://stripe.com/

## 🎯 Core Pages

- **Feed** (`/`): Main news feed with AI-curated articles
- **CTRLcast** (`/ctrlcast`): Daily AI podcast episodes
- **X Pulse** (`/x-pulse`): Top AI tweets and social signals
- **Saved** (`/saved`): User's bookmarked content
- **Profile** (`/profile`): User settings and subscription management

## 🚀 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🔮 Upcoming Features

- **CTRL/Ask**: Chat interface for news queries
- **CTRL/Create**: Let creators build custom AI shows
- **Newsletter**: Auto-generated email summaries via Resend
- **Offline Mode**: Cached content for offline reading
- **Community Features**: User reactions and discussions
- **Mobile App**: React Native version

## 📄 License

This project is built for demonstration and educational purposes. Please ensure you comply with all API terms of service when deploying.

## 🤝 Contributing

This is a demonstration project showcasing modern AI-powered news platform architecture. Feel free to explore the codebase and adapt it for your own projects!

---

**Built with ❤️ and AI** - CTRL/news represents the future of personalized, AI-driven media consumption.
