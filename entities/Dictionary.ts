import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@Entity("dictionary")
export class Dictionary {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  word: string;

  @Column({ nullable: true })
  spelling: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.dictionaryEntries, {
    onDelete: "CASCADE",
  })
  user: User;

  @Column()
  userId: string;
}
