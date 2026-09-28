import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Task } from "./Task.js";

@Entity({ name: "tags" })
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true, nullable: false })
  name!: string;

  // Inverse side: No @JoinTable here
  @ManyToMany(() => Task, (task) => task.tags)
  tasks!: Task[];
}
