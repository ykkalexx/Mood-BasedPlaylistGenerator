import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class MoodEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  inputText: string;

  @Column("jsonb")
  emotions: {
    primary: string;
    secondary: string;
    emotions: Record<string, number>;
    intensity: number;
    valence: number;
    arousal: number;
  };

  @Column("jsonb")
  generatedPlaylist: {
    spotifyPlaylistUrl: string;
    trackIds: string[];
    mood: string;
    features: {
      valence: number;
      energy: number;
      danceability: number;
      tempo_preference: number;
      instrumentalness: number;
      acousticness: number;
      popularity_target: number;
      recommended_genres: string[];
    };
    stats: {
      average_valence: number;
      average_energy: number;
      average_danceability: number;
      genres: string[];
    };
  };

  @CreateDateColumn()
  timestamp: Date;
}
