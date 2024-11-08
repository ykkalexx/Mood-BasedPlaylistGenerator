import axios from "axios";
import SpotifyWebApi from "spotify-web-api-node";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

interface EmotionAnalysis {
  primary: string;
  secondary: string;
  emotions: Record<string, number>;
  intensity: number;
  valence: number;
  arousal: number;
}

interface MusicFeatures {
  valence: number;
  energy: number;
  danceability: number;
  tempo_preference: number;
  instrumentalness: number;
  acousticness: number;
  popularity_target: number;
  recommended_genres: string[];
}

interface TrackAudioFeatures {
  valence: number;
  energy: number;
  danceability: number;
  instrumentalness: number;
  acousticness: number;
  [key: string]: number;
}

interface WeightedFeatures {
  valence: number;
  energy: number;
  danceability: number;
  instrumentalness: number;
  acousticness: number;
}

interface AnalysisResponse {
  emotion_analysis: EmotionAnalysis;
  music_features: MusicFeatures;
}

export class MoodAnalysisService {
  private spotifyApi: SpotifyWebApi;
  private readonly featureWeights: WeightedFeatures = {
    valence: 0.3,
    energy: 0.2,
    danceability: 0.2,
    instrumentalness: 0.15,
    acousticness: 0.15,
  };

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  private async initSpotifyToken(): Promise<void> {
    try {
      logger.info("Requesting Spotify access token...");
      const data = await this.spotifyApi.clientCredentialsGrant();
      const accessToken = data.body["access_token"];

      logger.info("Received Spotify access token");
      this.spotifyApi.setAccessToken(accessToken);
    } catch (error: any) {
      logger.error("Failed to get Spotify token:", {
        error: error.message,
        details: error.body,
      });
      throw error;
    }
  }

  public async analyzeMood(text: string): Promise<any> {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/analyze`, { text });
      return response.data;
    } catch (error) {
      logger.error("Error analyzing mood:", error);
      throw error;
    }
  }

  public async testSpotifyConnection(): Promise<any> {
    try {
      logger.info("Starting Spotify connection test");

      // Try to get an access token
      const authResponse = await this.spotifyApi.clientCredentialsGrant();
      logger.info("Got auth response:", {
        tokenLength: authResponse.body["access_token"]?.length,
        expiresIn: authResponse.body["expires_in"],
      });

      this.spotifyApi.setAccessToken(authResponse.body["access_token"]);

      // Test the token with a simple search
      const searchResponse = await this.spotifyApi.searchTracks("test");

      return {
        connected: true,
        tokenReceived: true,
        searchSuccessful: true,
        tracksFound: searchResponse.body.tracks?.total || 0,
        clientIdLength: process.env.SPOTIFY_CLIENT_ID?.length,
        clientSecretLength: process.env.SPOTIFY_CLIENT_SECRET?.length,
      };
    } catch (error: any) {
      logger.error("Spotify connection test failed:", {
        error: error.message,
        body: error.body,
        statusCode: error.statusCode,
      });

      return {
        connected: false,
        error: error.message,
        statusCode: error.statusCode,
        errorDetails: error.body,
        clientIdLength: process.env.SPOTIFY_CLIENT_ID?.length,
        clientSecretLength: process.env.SPOTIFY_CLIENT_SECRET?.length,
      };
    }
  }

  public async generatePlaylist(emotions: any): Promise<any> {
    try {
      await this.initSpotifyToken();

      // getting emotion analysis and music features from the python service
      const response = await axios.post<AnalysisResponse>(
        `${ML_SERVICE_URL}/analyze`
      );
      const { emotion_analysis, music_features } = response.data;
      logger.info("Received analysis:", { emotion_analysis, music_features });

      // getting  recommendations based on features
      const recommendations = await this.spotifyApi.getRecommendations({
        target_valence: music_features.valence,
        target_energy: music_features.energy,
        target_danceability: music_features.danceability,
        target_instrumentalness: music_features.instrumentalness,
        target_acousticness: music_features.acousticness,
        min_popularity: music_features.popularity_target - 10,
        max_popularity: music_features.popularity_target + 10,
        seed_genres: music_features.recommended_genres.slice(0, 3),
        limit: 20,
      });

      // getting  audio features for recommended tracks
      const trackIds = recommendations.body.tracks.map((track) => track.id);
      const audioFeatures = await this.spotifyApi.getAudioFeaturesForTracks(
        trackIds
      );

      // scoring  and sort tracks based on feature match
      const scoredTracks = recommendations.body.tracks.map((track, index) => {
        const features = audioFeatures.body.audio_features[
          index
        ] as unknown as TrackAudioFeatures;
        const score = this.calculateTrackScore(features, music_features);
        return { track, score };
      });

      scoredTracks.sort((a, b) => b.score - a.score);

      // taking  top 10 tracks
      const finalTracks = scoredTracks.slice(0, 10).map((item) => item.track);

      return {
        tracks: finalTracks,
        emotion_analysis,
        music_features,
        playlist_stats: {
          average_valence: this.average(finalTracks, "valence"),
          average_energy: this.average(finalTracks, "energy"),
          average_danceability: this.average(finalTracks, "danceability"),
          genres: music_features.recommended_genres,
        },
      };
    } catch (error) {
      logger.error("Error generating playlist:", error);
      throw error;
    }
  }

  private calculateTrackScore(
    trackFeatures: TrackAudioFeatures,
    targetFeatures: MusicFeatures
  ): number {
    return (
      Object.keys(this.featureWeights) as Array<keyof WeightedFeatures>
    ).reduce((score, feature) => {
      const weight = this.featureWeights[feature];
      const diff = Math.abs(trackFeatures[feature] - targetFeatures[feature]);
      return score - diff * weight;
    }, 1);
  }

  private average(tracks: any[], feature: string): number {
    const sum = tracks.reduce((acc, track) => acc + (track[feature] || 0), 0);
    return sum / tracks.length;
  }
}
