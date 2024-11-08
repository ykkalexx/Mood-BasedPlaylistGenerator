##Overview

A sophisticated API system that generates personalized Spotify playlists based on emotional analysis of user text input. The system uses machine learning to analyze emotions and creates curated playlists that match the user's emotional state.

##System Architecture

The application consists of three main components:

Node.js/TypeScript Backend

- Handles API requests
- Manages Spotify integration
- Coordinates between services
- Handles data persistence

Python ML Service

- Performs emotion analysis
- Generates music features
- Maps emotions to musical characteristics

PostgreSQL Database

- Stores mood entries
- Tracks generated playlists
- Maintains analysis history

##Tech Stack

- Backend: Node.js with TypeScript
- ML Service: Python with Flask
- Database: PostgreSQL
- ORM: TypeORM
- ML Libraries: transformers, scikit-learn
- API Integration: Spotify Web API

##Features

- Emotion analysis from text input
- Music feature generation based on emotions
- Spotify playlist generation
- Historical tracking of mood entries
- Advanced playlist customization
- Multi-dimensional emotion mapping
