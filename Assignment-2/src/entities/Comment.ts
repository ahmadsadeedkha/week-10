import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { Task } from './Task.js';
import { User } from './User.js';

@Entity({ name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  task_id!: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'task_id' })
  task!: Relation<Task>;

  @Column({ type: 'int', nullable: false })
  author_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: Relation<User>;

  @Column({ type: 'text', nullable: false })
  body!: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;
}
