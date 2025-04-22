import { IsString } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
export class PartialUser {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  role: Role;

  @Column({ nullable: true })
  phone?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @IsString()
  refreshToken?: string;
}
