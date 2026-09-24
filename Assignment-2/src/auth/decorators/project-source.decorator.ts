import { SetMetadata } from '@nestjs/common';

export type ProjectSource =
  | { type: 'route-param'; param: string } // e.g. :id IS the project id (project routes)
  | { type: 'body-field'; field: string } // e.g. body.projectId (task creation)
  | { type: 'task-param'; param: string }; // e.g. :id is a TASK id — load task, use its project

export const PROJECT_SOURCE_KEY = 'projectSource';
export const ProjectSourceFrom = (source: ProjectSource) =>
  SetMetadata(PROJECT_SOURCE_KEY, source);
