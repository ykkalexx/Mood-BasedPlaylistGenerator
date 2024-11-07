import axios from "axios";
import SpotifyWebApi from "spotify-web-api-node";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";

export class MoodAnalysisService {
  private spotifyApi: SpotifyWebApi;

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

  private async ensureValidToken(): Promise<void> {
    try {
      await this.initSpotifyToken();
    } catch (error) {
      logger.error("Token initialization failed:", error);
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
      await this.ensureValidToken();

      // Get music features from ML service
      const response = await axios.post(
        `${ML_SERVICE_URL}/generate-playlist`,
        emotions
      );
      const { features } = response.data;

      // Get recommendations
      const recommendations = await this.spotifyApi.getRecommendations({
        target_valence: features.valence,
        target_energy: features.energy,
        target_danceability: features.danceability,
        seed_genres: ["pop", "rock", "indie"],
        min_popularity: 50,
        limit: 10,
      });

      return {
        tracks: recommendations.body.tracks,
        mood: emotions.primary,
        features,
      };
    } catch (error) {
      logger.error("Error generating playlist:", error);
      throw error;
    }
  }
}
