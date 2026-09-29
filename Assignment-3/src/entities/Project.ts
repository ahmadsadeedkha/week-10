import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from "typeorm";
import { User } from "./User.js";
import { Task } from "./Task.js";

@Entity({ name: "projects" })
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", nullable: false })
  name!: string;

  @Column({ type: "int", nullable: false })
  owner_id!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  created_at!: Date;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Relation<Task>[];
}
