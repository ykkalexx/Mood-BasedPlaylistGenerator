import { createConnection, Connection } from "typeorm";
import { MoodEntry } from "../models/mood.model";
import { logger } from "../utils/logger";

export const initializeDatabase = async (): Promise<Connection> => {
  try {
    const connection = await createConnection({
      type: "postgres",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [MoodEntry],
      synchronize: process.env.NODE_ENV === "development",
      logging: process.env.NODE_ENV === "development",
    });
    logger.info("Database connection established");
    return connection;
  } catch (error) {
    logger.error("Database connection failed:", error);
    throw error;
  }
};
