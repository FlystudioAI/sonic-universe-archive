# 🎵 TunesDB - The World's Smartest Music Database

**TunesDB** is an AI-powered, conversational music platform that serves as the "IMDb for music" — built for the streaming generation. It combines comprehensive music data aggregation with cutting-edge AI to create the most interactive and intelligent music discovery experience ever built.

![TunesDB](https://img.shields.io/badge/TunesDB-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.51.0-green)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange)

## 🌟 Key Features

### 🤖 AI-First, Conversational Platform
- **SonicSage AI**: Advanced music oracle powered by GPT-4 for natural language music exploration
- **Smart Search**: AI-powered search that understands mood, genre, energy, and cultural context
- **Dynamic Recommendations**: Personalized music discovery based on listening history and preferences
- **Multimodal Input**: Voice queries, mood descriptions, and contextual search

### 🗄️ Comprehensive Music Database
- **Multi-API Integration**: Aggregates data from MusicBrainz, Last.fm, Genius, AudioDB, and Discogs
- **Rich Metadata**: Detailed song information including BPM, key, mood, energy, instruments, and themes
- **Artist Profiles**: Complete biographies, influences, and cultural context
- **Global Coverage**: Music from every corner of the world with cultural insights

### 🌍 Global Music Discovery
- **Interactive World Map**: Explore trending music by city and country
- **Cultural Context**: Understand regional music scenes and emerging trends
- **Real-time Charts**: Track what's popular across different regions and genres
- **Music DNA**: AI-generated explanations of genre evolution and artist connections

### 💬 Interactive Features
- **Music Chat**: Have conversations about any song, artist, or musical topic
- **Smart Filters**: Filter by mood, energy, era, location, and cultural themes
- **Live Trends**: Real-time tracking of viral music and emerging artists
- **Social Discovery**: Community-driven music exploration and recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Music API keys (Last.fm, Genius, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/tunesdb.git
cd tunesdb
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Fill in your API keys in the `.env` file:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Integration
OPENAI_API_KEY=your_openai_api_key

# Music APIs
LASTFM_API_KEY=your_lastfm_api_key
GENIUS_ACCESS_TOKEN=your_genius_access_token
DISCOGS_API_KEY=your_discogs_api_key
MUSICBRAINZ_USER_AGENT=TunesDB/1.0.0 (your_email@example.com)
```

4. **Start Supabase local development**
```bash
npm run supabase:start
```

5. **Import sample music data**
```bash
npm run import:data 50 20  # Import 50 artists with 20 tracks each
```

6. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see TunesDB in action! 🎉

## 🔧 Configuration

### API Keys Setup

#### Required APIs (Free):
- **Last.fm API**: Get your free API key at [last.fm/api](https://www.last.fm/api)
- **MusicBrainz**: No API key required, just set a user agent
- **AudioDB**: Free API, no key required
- **OpenAI**: Get API key at [platform.openai.com](https://platform.openai.com/)

#### Optional APIs:
- **Genius API**: For lyrics and song details
- **Discogs API**: For vinyl and release information
- **Spotify API**: For audio features and track previews
- **YouTube API**: For music videos and additional metadata

### Database Setup

TunesDB uses Supabase with a comprehensive schema:

```sql
-- Artists, Songs, Albums with rich metadata
-- User profiles and listening history
-- AI embeddings for similarity search
-- Real-time chat and recommendations
```

Run migrations:
```bash
supabase db reset
```

## 📊 Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** + **shadcn/ui** for styling
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Router** for navigation

### Backend Stack
- **Supabase** for database and authentication
- **Supabase Edge Functions** for AI integration
- **OpenAI GPT-4** for conversational AI
- **Vector embeddings** for similarity search

### Data Sources
- **MusicBrainz**: Open music encyclopedia
- **Last.fm**: Listening behavior and trends
- **Genius**: Lyrics and song meanings
- **AudioDB**: Artist biographies and images
- **Discogs**: Release information and catalog data

## 🎯 Core Components

### SonicSage AI Chat
The heart of TunesDB - a conversational AI that can discuss any musical topic:

```typescript
// Example usage
const response = await aiService.chatWithMusicOracle(
  "Tell me about the influence of Detroit techno on modern electronic music",
  conversationHistory,
  musicContext
);
```

### AI-Powered Search
Understands natural language queries and finds relevant music:

```typescript
// Search with natural language
const results = await searchService.searchMusic(
  "Find me some chill synthwave for a rainy night in Tokyo"
);
```

### Global Music Map
Interactive world map showing regional music trends:

```tsx
<GlobalMusicMap 
  onRegionSelect={(region) => exploreRegionalMusic(region)}
  showTrends={true}
  culturalContext={true}
/>
```

## 🌐 API Integrations

### Music Data Sources

#### MusicBrainz
- **Purpose**: Core music metadata and relationships
- **Rate Limit**: 1 request/second
- **Coverage**: 2M+ artists, 25M+ recordings

#### Last.fm
- **Purpose**: Listening trends, user behavior, recommendations
- **Rate Limit**: 5 requests/second
- **Coverage**: Global listening data, charts, similar artists

#### Genius
- **Purpose**: Lyrics, song meanings, artist biographies
- **Rate Limit**: 1000 requests/day (free tier)
- **Coverage**: 10M+ songs with annotations

#### AudioDB
- **Purpose**: Artist images, biographies, discographies
- **Rate Limit**: No official limit
- **Coverage**: 200K+ artists with rich media

### AI Integration

#### OpenAI GPT-4
- **SonicSage Chat**: Conversational music expert
- **Search Analysis**: Query understanding and intent detection
- **Content Generation**: Artist bios, playlist descriptions
- **Embeddings**: Semantic similarity and recommendations

## 🛠️ Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── AISearchInterface.tsx
│   ├── MusicChatInterface.tsx
│   ├── GlobalMusicMap.tsx
│   └── ...
├── services/           # API integrations
│   ├── aiService.ts
│   ├── musicDataService.ts
│   └── ...
├── pages/              # Page components
├── hooks/              # Custom React hooks
└── lib/                # Utilities and helpers

supabase/
├── functions/          # Edge functions
│   ├── ai-music-search/
│   ├── music-chat/
│   └── ...
├── migrations/         # Database migrations
└── config.toml        # Supabase configuration

scripts/
└── import-music-data.js # Data import script
```

### Key Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run supabase:start  # Start local Supabase
npm run supabase:stop   # Stop local Supabase
npm run supabase:reset  # Reset database with migrations

# Data Management
npm run import:data     # Import music data from APIs
npm run import:data 100 30  # Import 100 artists, 30 tracks each
```

### Adding New Features

1. **New Music API Integration**:
   - Add service to `src/services/musicDataService.ts`
   - Update import script in `scripts/import-music-data.js`
   - Add API credentials to `.env.example`

2. **New AI Features**:
   - Extend `src/services/aiService.ts`
   - Create Supabase edge function if needed
   - Add UI components for new functionality

3. **New UI Components**:
   - Use shadcn/ui as base components
   - Follow existing patterns for animations
   - Add to component library in `src/components/`

## 🔮 Roadmap

### Phase 1: Core Platform (✅ Complete)
- [x] AI chat interface with SonicSage
- [x] Multi-API music data aggregation
- [x] Advanced search with AI analysis
- [x] Global music map
- [x] User authentication and profiles

### Phase 2: Enhanced Discovery (🚧 In Progress)
- [ ] Mood-based playlist generation
- [ ] Audio fingerprinting and recognition
- [ ] Live music event integration
- [ ] Social features and user sharing

### Phase 3: Advanced AI (📋 Planned)
- [ ] Voice interface with Whisper API
- [ ] Image-to-music search
- [ ] AI music composition tools
- [ ] Predictive trend analysis

### Phase 4: Platform Expansion (🔮 Future)
- [ ] Mobile app (React Native)
- [ ] Music streaming integration
- [ ] Artist collaboration tools
- [ ] Record label partnerships

## 💰 Monetization Strategy

### Free Tier
- Core database access and search
- Limited AI chat interactions (50/month)
- Basic music discovery features
- Ad-supported experience

### Premium Tier ($9.99/month)
- Unlimited AI conversations with SonicSage
- Advanced mood and cultural search filters
- Personalized AI playlists and recommendations
- Priority access to new features
- Ad-free experience

### Enterprise Tier (Custom pricing)
- API access for music platforms
- Custom AI training on specific catalogs
- White-label solutions for music services
- Advanced analytics and insights

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Add JSDoc comments for new functions
- Include tests for new features
- Follow the existing code style
- Update documentation for new APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MusicBrainz** for the incredible open music database
- **Last.fm** for music discovery and trend data
- **Genius** for lyrics and song meanings
- **OpenAI** for the powerful GPT-4 API
- **Supabase** for the excellent backend platform
- **shadcn/ui** for beautiful, accessible components

## 📞 Support & Contact

- **Documentation**: [docs.tunesdb.com](https://docs.tunesdb.com)
- **Community**: [discord.gg/tunesdb](https://discord.gg/tunesdb)
- **Issues**: [GitHub Issues](https://github.com/your-username/tunesdb/issues)
- **Email**: hello@tunesdb.com

---

**Built with ❤️ by the TunesDB team**

*Making music discovery intelligent, conversational, and culturally aware.* 🎵
