import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { User } from './entities/User.js';
import { Project } from './entities/Project.js';
import { Task } from './entities/Task.js';
import { Tag } from './entities/Tag.js';
import { Comment } from './entities/Comment.js';
import { ProjectMember } from './entities/ProjectMember.js';
import { RefreshToken } from './entities/RefreshToken.js';

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const entities = [
  User,
  Project,
  Task,
  Tag,
  Comment,
  ProjectMember,
  RefreshToken,
];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: getEnv('DB_HOST'),
  port: Number(getEnv('DB_PORT')),
  username: getEnv('DB_USERNAME'),
  password: getEnv('DB_PASSWORD'),
  database: getEnv('DB_DATABASE'),
  synchronize: false,
  logging: false,
  entities,
  subscribers: [],
};

export default new DataSource({
  ...dataSourceOptions,
  migrations: ['src/migrations/*.ts'],
});
