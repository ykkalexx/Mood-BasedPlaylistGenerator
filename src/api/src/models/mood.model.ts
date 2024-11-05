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
    secondary?: string;
    intensity: number;
  };

  @Column("jsonb")
  generatedPlaylist: {
    spotifyPlaylistUrl: string;
    trackIds: string[];
    mood: string;
  };

  @CreateDateColumn()
  timestamp: Date;
}
