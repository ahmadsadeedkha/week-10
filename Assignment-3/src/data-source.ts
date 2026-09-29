import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from './config/env.js';

import { User } from './entities/User.js';
import { Project } from './entities/Project.js';
import { Task } from './entities/Task.js';
import { Tag } from './entities/Tag.js';
import { Comment } from './entities/Comment.js';
import { ProjectMember } from './entities/ProjectMember.js';
import { RefreshToken } from './entities/RefreshToken.js';

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
  host: env.dbHost,
  port: env.dbPort,
  username: env.dbUsername,
  password: env.dbPassword,
  database: env.dbDatabase,
  synchronize: false,
  logging: false,
  entities,
  subscribers: [],
};

export default new DataSource({
  ...dataSourceOptions,
  migrations: ['src/migrations/*.ts'],
});
