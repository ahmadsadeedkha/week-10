import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User.js";
import { Project } from "./Project.js";
import { ProjectRole } from "./Enums.js";

@Entity({ name: "project_members" })
export class ProjectMember {
  @PrimaryColumn({ type: "int" })
  user_id!: number;

  @PrimaryColumn({ type: "int" })
  project_id!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Project, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({
    type: "enum",
    enum: ProjectRole,
    enumName: "project_member_role",
    nullable: false,
  })
  role!: ProjectRole;
}
