export class UserResponseDto {
  id!: number;
  name!: string;
  email!: string;
  created_at!: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
