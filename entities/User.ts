import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

// Use dynamic imports to avoid circular dependency
const getTranscription = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./Transcription").Transcription;
};

const getDictionary = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./Dictionary").Dictionary;
};

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

  @OneToMany(getTranscription, "user")
  transcriptions!: unknown[];

  @OneToMany(getDictionary, "user")
  dictionaryEntries!: unknown[];
}
