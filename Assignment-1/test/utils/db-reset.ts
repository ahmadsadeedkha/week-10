import { DataSource } from 'typeorm';

export async function resetDatabase(dataSource: DataSource) {
  const tables = [
    'task_tags',
    'refresh_tokens',
    'comments',
    'project_members',
    'tasks',
    'tags',
    'projects',
    'users',
  ];

  await dataSource.query(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
}
