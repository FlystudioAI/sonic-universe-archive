# Contributing to TunesDB 🎵

Thank you for your interest in contributing to TunesDB! We're excited to have you join our mission to create the world's smartest music database.

## 🌟 How to Contribute

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, please include as many details as possible:

**Bug Report Template:**
```
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js version: [e.g. 18.17.0]
- TunesDB version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### 💡 Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear description** of the enhancement
- **Use case** explaining why this would be useful
- **Possible implementation** if you have ideas
- **Mockups or examples** if applicable

### 🚀 Pull Requests

1. **Fork the repository**
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Commit your changes** with descriptive messages:
   ```bash
   git commit -m "feat: add voice search functionality"
   ```
7. **Push to your branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

## 📋 Development Guidelines

### 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── AISearchInterface.tsx
│   ├── MusicChatInterface.tsx
│   ├── GlobalMusicMap.tsx
│   └── ...
├── services/           # API integrations and business logic
│   ├── aiService.ts
│   ├── musicDataService.ts
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
├── pages/              # Page components
└── types/              # TypeScript type definitions

supabase/
├── functions/          # Edge functions
├── migrations/         # Database migrations
└── config.toml        # Supabase configuration
```

### 🎨 Code Style

We use TypeScript with strict type checking. Please follow these conventions:

#### **React Components**
```typescript
// Use named exports for components
export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic here
  return <div>...</div>;
};

// Default export for pages
const PageName = () => {
  return <div>...</div>;
};

export default PageName;
```

#### **TypeScript Interfaces**
```typescript
// Use PascalCase for interfaces
interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
}

// Use descriptive names for props
interface SearchResultsProps {
  tracks: MusicTrack[];
  onTrackSelect: (track: MusicTrack) => void;
  isLoading?: boolean;
}
```

#### **API Services**
```typescript
// Group related API calls in classes
export class MusicService {
  async searchTracks(query: string): Promise<MusicTrack[]> {
    // Implementation
  }

  async getTrackDetails(id: string): Promise<MusicTrack | null> {
    // Implementation
  }
}

// Export instance for consumption
export const musicService = new MusicService();
```

### 🧪 Testing

- Write tests for new features using the existing test setup
- Ensure all tests pass before submitting PR
- Include both unit tests and integration tests where appropriate

### 📚 Documentation

- Update JSDoc comments for new functions
- Update README.md for new features
- Add inline comments for complex logic
- Update API documentation for new endpoints

## 🎯 Contribution Areas

### 🤖 AI & Machine Learning
- Improve music recommendation algorithms
- Enhance natural language processing for search
- Add new AI-powered features (mood detection, audio analysis)
- Optimize embedding generation and similarity search

### 🗄️ Data Integration
- Add new music API integrations (Spotify, Apple Music, etc.)
- Improve data quality and validation
- Add support for new music metadata formats
- Enhance real-time data synchronization

### 🎨 Frontend Development
- Improve UI/UX design and accessibility
- Add new interactive components
- Optimize performance and loading times
- Enhance mobile responsiveness

### 🔧 Backend Development
- Optimize database queries and performance
- Add new Supabase edge functions
- Improve error handling and logging
- Enhance security and authentication

### 🌍 Internationalization
- Add support for new languages
- Improve cultural music context
- Add region-specific music data
- Enhance global music discovery features

## 🛠️ Development Setup

1. **Clone and setup:**
   ```bash
   git clone https://github.com/your-username/tunesdb.git
   cd tunesdb
   ./setup.sh  # Run automated setup
   ```

2. **Manual setup:**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your API keys
   npm run supabase:start
   npm run import:data 20 10
   npm run dev
   ```

3. **Before submitting PR:**
   ```bash
   npm run lint        # Check code style
   npm run test        # Run tests
   npm run build       # Ensure build works
   ```

## 🔍 API Key Setup

For development, you'll need these API keys:

### Required (Free):
- **OpenAI API**: [platform.openai.com](https://platform.openai.com/)
- **Last.fm API**: [last.fm/api](https://www.last.fm/api)
- **Supabase**: [supabase.com](https://supabase.com)

### Optional:
- **Genius API**: [genius.com/api-clients](https://genius.com/api-clients)
- **Discogs API**: [discogs.com/developers](https://www.discogs.com/developers/)
- **Spotify API**: [developer.spotify.com](https://developer.spotify.com/)

## 📝 Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(search): add voice search functionality
fix(chat): resolve AI response timeout issue
docs(api): update music service documentation
style(components): improve code formatting
refactor(database): optimize query performance
test(ai): add unit tests for recommendation engine
chore(deps): update dependencies to latest versions
```

## 🎭 Community Guidelines

### 🤝 Be Respectful
- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

### 🎵 Music Passion
- Share your love for music and technology
- Be open to exploring new genres and cultures
- Help make music more accessible and discoverable
- Celebrate the diversity of musical expression

### 🔬 Technical Excellence
- Write clean, maintainable code
- Follow established patterns and conventions
- Test your changes thoroughly
- Document your work clearly

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **Community Discord** shoutouts
- **Annual contributor awards**

## 📞 Getting Help

- **Discord**: [discord.gg/tunesdb](https://discord.gg/tunesdb)
- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bug reports and feature requests
- **Email**: developers@tunesdb.com

## 📄 License

By contributing to TunesDB, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make TunesDB awesome! 🎵**

*Every contribution, no matter how small, makes a difference in creating the world's smartest music database.*