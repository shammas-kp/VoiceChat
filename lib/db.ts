import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Transcription } from "../entities/Transcription";
import { Dictionary } from "../entities/Dictionary";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  username: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
  database: process.env.DATABASE_NAME || "voice_keyboard",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  entities: [User, Transcription, Dictionary],
  migrations: [],
  subscribers: [],
});

let isInitialized = false;

export async function initializeDatabase() {
  if (!isInitialized && !AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    isInitialized = true;
    console.log("Database connected successfully");
  }
  return AppDataSource;
}

export async function getDatabase() {
  if (!AppDataSource.isInitialized) {
    await initializeDatabase();
  }
  return AppDataSource;
}
