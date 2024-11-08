# Mood-Based Playlist Generator API Documentation

## Base URL

http://localhost:3000/api

## Endpoints

### 1. Analyze Mood and Generate Playlist

Generate a playlist based on emotional analysis of input text.

#### Request

```http
POST /mood/analyze
Content-Type: application/json

{
    "text": "I'm feeling really happy and excited"
}
```

#### Response

{
"moodEntryId": "uuid",
"emotion_analysis": {
"primary": "joy",
"secondary": "excitement",
"emotions": {
"joy": 0.8,
"excitement": 0.6,
"fear": 0.2,
"sadness": 0.1
},
"intensity": 0.85,
"valence": 0.75,
"arousal": 0.7
},
"music_features": {
"valence": 0.8,
"energy": 0.7,
"danceability": 0.65,
"tempo_preference": 0.7,
"instrumentalness": 0.3,
"acousticness": 0.4,
"popularity_target": 70,
"recommended_genres": ["pop", "dance", "electronic"]
},
"playlist": {
"tracks": [
{
"id": "spotify_track_id",
"name": "Track Name",
"artists": ["Artist Name"],
"external_urls": {
"spotify": "spotify_track_url"
}
}
// ... more tracks
],
"stats": {
"average_valence": 0.75,
"average_energy": 0.7,
"average_danceability": 0.68,
"genres": ["pop", "dance"]
}
}
}

#### Request

GET /mood/history

{
"entries": [
{
"id": "uuid",
"inputText": "I'm feeling really happy and excited",
"emotions": {
"primary": "joy",
"secondary": "excitement",
"emotions": {
"joy": 0.8,
"excitement": 0.6
},
"intensity": 0.85,
"valence": 0.75,
"arousal": 0.7
},
"generatedPlaylist": {
"spotifyPlaylistUrl": "spotify_playlist_url",
"trackIds": ["track_id_1", "track_id_2"],
"mood": "joy"
},
"timestamp": "2024-11-08T11:35:33Z"
}
// ... more entries
]
}

#### 3. Test Spotify Connection

#### Test the connection to Spotify API.

GET /mood/test-spotify

{
"connected": true,
"tokenReceived": true,
"searchSuccessful": true,
"tracksFound": 10,
"clientIdLength": 32,
"clientSecretLength": 32
}
