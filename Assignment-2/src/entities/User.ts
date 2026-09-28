import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'users' })
@Index('users_email_lower_idx', { synchronize: false })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', unique: true, nullable: false })
  email!: string;

  @Column({ type: 'text', nullable: false, select: false })
  password_hash!: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;
}
