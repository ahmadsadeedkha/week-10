import { IsInt, IsEnum } from 'class-validator';
import { ProjectRole } from '../../entities/Enums.js';

export class AddMemberDto {
  @IsInt()
  userId: number;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}
