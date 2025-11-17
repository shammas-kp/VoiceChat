import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Transcription } from "./Transcription";
import { Dictionary } from "./Dictionary";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transcription, (transcription) => transcription.user)
  transcriptions: Transcription[];

  @OneToMany(() => Dictionary, (dictionary) => dictionary.user)
  dictionaryEntries: Dictionary[];
}
