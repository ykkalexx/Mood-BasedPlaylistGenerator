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

  public async generatePlaylist(emotions: {
    emotion_analysis: EmotionAnalysis;
    music_features: MusicFeatures;
  }): Promise<any> {
    try {
      await this.initSpotifyToken();

      const { emotion_analysis, music_features } = emotions;
      logger.info("Using existing analysis:", {
        emotion_analysis,
        music_features,
      });

      // simplifying  the seed genres to known valid Spotify genres
      const validSpotifyGenres = ["pop", "rock", "electronic"];

      // simplifying  recommendations parameters
      const recommendationParams = {
        target_valence: Number(music_features.valence.toFixed(2)),
        target_energy: Number(music_features.energy.toFixed(2)),
        target_danceability: Number(music_features.danceability.toFixed(2)),
        min_popularity: 50,
        seed_genres: validSpotifyGenres.slice(0, 2),
        limit: 20,
      };

      logger.info("Getting recommendations with params:", recommendationParams);

      // Get recommendations
      const recommendations = await this.spotifyApi.getRecommendations(
        recommendationParams
      );

      if (!recommendations.body.tracks?.length) {
        throw new Error("No tracks returned from Spotify recommendations");
      }

      // Get audio features for recommended tracks
      const trackIds = recommendations.body.tracks.map((track) => track.id);
      const audioFeatures = await this.spotifyApi.getAudioFeaturesForTracks(
        trackIds
      );

      // Score and sort tracks
      const scoredTracks = recommendations.body.tracks.map((track, index) => {
        const features = audioFeatures.body.audio_features[
          index
        ] as unknown as TrackAudioFeatures;
        const score = this.calculateTrackScore(features, music_features);
        return { track, score };
      });

      scoredTracks.sort((a, b) => b.score - a.score);

      // Take top 10 tracks
      const finalTracks = scoredTracks.slice(0, 10).map((item) => item.track);

      return {
        tracks: finalTracks,
        emotion_analysis,
        music_features,
        playlist_stats: {
          average_valence: this.average(finalTracks, "valence"),
          average_energy: this.average(finalTracks, "energy"),
          average_danceability: this.average(finalTracks, "danceability"),
          genres: validSpotifyGenres,
        },
      };
    } catch (error) {
      logger.error("Error generating playlist:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
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
    if (!tracks.length) return 0;
    const sum = tracks.reduce((acc, track) => acc + (track[feature] || 0), 0);
    return sum / tracks.length;
  }
}
