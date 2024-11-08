import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { MoodEntry } from "../models/mood.model";
import { MoodAnalysisService } from "../services/moodAnalysis.service";
import { logger } from "../utils/logger";

interface PlaylistResponse {
  tracks: Array<{
    id: string;
    external_urls: {
      spotify: string;
    };
  }>;
  emotion_analysis: {
    primary: string;
    secondary: string;
    emotions: Record<string, number>;
    intensity: number;
    valence: number;
    arousal: number;
  };
  music_features: {
    valence: number;
    energy: number;
    danceability: number;
    tempo_preference: number;
    instrumentalness: number;
    acousticness: number;
    popularity_target: number;
    recommended_genres: string[];
  };
  playlist_stats: {
    average_valence: number;
    average_energy: number;
    average_danceability: number;
    genres: string[];
  };
}

export class MoodController {
  private moodAnalysisService: MoodAnalysisService;

  constructor() {
    this.moodAnalysisService = new MoodAnalysisService();
  }

  public analyze = async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: "Text is required" });
        return;
      }

      // First get emotion analysis
      const analysisResponse = await this.moodAnalysisService.analyzeMood(text);
      logger.info("Emotion analysis complete:", analysisResponse);

      // Generate playlist using the analysis
      const playlist = await this.moodAnalysisService.generatePlaylist(
        analysisResponse
      );

      const moodRepo = getRepository(MoodEntry);

      const moodEntry = moodRepo.create({
        inputText: text,
        emotions: analysisResponse.emotion_analysis,
        generatedPlaylist: {
          spotifyPlaylistUrl: playlist.tracks[0].external_urls.spotify,
          trackIds: playlist.tracks.map((track: any) => track.id),
          mood: analysisResponse.emotion_analysis.primary,
        },
      });

      await moodRepo.save(moodEntry);

      res.json({
        moodEntryId: moodEntry.id,
        emotion_analysis: analysisResponse.emotion_analysis,
        music_features: analysisResponse.music_features,
        playlist: {
          tracks: playlist.tracks,
          stats: playlist.playlist_stats,
        },
      });
    } catch (error) {
      logger.error("Error in mood analysis:", error);
      res
        .status(500)
        .json({ error: "Failed to analyze mood and generate playlist" });
    }
  };

  public getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const moodEntryRepo = getRepository(MoodEntry);
      const entries = await moodEntryRepo.find({
        order: { timestamp: "DESC" },
        take: 10,
      });

      res.json(entries);
    } catch (error) {
      logger.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch mood history" });
    }
  };

  public testSpotify = async (req: Request, res: Response): Promise<void> => {
    try {
      const testResult = await this.moodAnalysisService.testSpotifyConnection();
      res.json(testResult);
    } catch (error) {
      logger.error("Error testing Spotify connection:", error);
      res.status(500).json({
        error: "Failed to test Spotify connection",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
