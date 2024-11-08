# 🎵 Mood-Based Playlist Generator

An intelligent API system that creates personalized Spotify playlists by analyzing the emotional content of text input using machine learning. The system performs sentiment analysis on user text, maps emotions to musical features, and generates curated playlists that match the user's emotional state.

## ✨ Features

- **Emotion Analysis**: Utilizes advanced NLP to analyze text for emotional content
- **Music Feature Mapping**: Converts emotional analysis into musical characteristics
- **Playlist Generation**: Creates personalized Spotify playlists based on emotional analysis
- **History Tracking**: Maintains a record of mood entries and generated playlists
- **Advanced Scoring**: Uses sophisticated algorithms to match songs with emotional states

## 🛠️ Tech Stack

- **Backend**: Node.js with TypeScript
- **ML Service**: Python with Flask
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **ML Libraries**: transformers, scikit-learn
- **API Integration**: Spotify Web API

## 📋 Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- PostgreSQL
- Spotify Developer Account
- npm/yarn

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/ykkalexx/Mood-BasedPlaylistGenerator
cd mood-playlist-generator
cd scripts
and then run get-started.ps1
```

2. **Setup .env file**

# Server Configuration

PORT=3000
NODE_ENV=development

# Database Configuration

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=mood_playlist_db

# Spotify Configuration

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# ML Service Configuration

ML_SERVICE_URL=http://localhost:5000

# 🧪 System Flow

1. User submits text describing their mood
2. ML service analyzes emotional content
3. Emotions are mapped to musical features
4. Spotify API generates recommendations
5. Tracks are scored and filtered
6. Final playlist is created and returned
7. Results are stored in database

For more documentation go to the docs folder
