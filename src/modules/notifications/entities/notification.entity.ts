
import { User } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(()=> User)
  @JoinColumn({name: 'user_id'})
  user: User

  @Column()
  type: string;

  @Column()
  message: string;

  @Column({ default: false })
  seen: boolean;
}
