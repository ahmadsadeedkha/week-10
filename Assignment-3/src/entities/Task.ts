import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
  type Relation,
} from 'typeorm';
import { Project } from './Project.js';
import { User } from './User.js';
import { Tag } from './Tag.js';
import { TaskStatus } from './Enums.js';

@Entity({ name: 'tasks' })
@Index('idx_tasks_project_id', ['project_id'])
@Index('idx_tasks_assignee_id', ['assignee_id'])
@Index('idx_tasks_status', ['status'])
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status',
    default: TaskStatus.TODO,
    nullable: false,
  })
  status!: TaskStatus;

  @Column({ type: 'int', nullable: false })
  priority!: number;

  @Column({ type: 'int', nullable: false })
  project_id!: number;

  @ManyToOne(() => Project, (project) => project.tasks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'project_id' })
  project!: Relation<Project>;

  @Column({ type: 'int', nullable: true })
  assignee_id!: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee!: User | null;

  @Column({ type: 'date', nullable: true })
  due_date!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @ManyToMany(() => Tag, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'task_tags',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];
}
