import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@Entity("transcriptions")
export class Transcription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  text: string;

  @Column({ type: "int", default: 0 })
  duration: number; // Duration in seconds

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.transcriptions, { onDelete: "CASCADE" })
  user: User;

  @Column()
  userId: string;
}
