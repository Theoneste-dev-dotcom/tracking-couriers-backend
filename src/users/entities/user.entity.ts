import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({unique: true})
  email: string;

  @Column()
  password: string;
  @Column( {
    type :'enum',
    enum: Role,
    default: Role.CLIENT
  })
  role: Role;
}
