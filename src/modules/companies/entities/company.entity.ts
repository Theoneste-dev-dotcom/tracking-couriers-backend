  import { Branch } from 'src/branches/entities/branch.entity';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
  import { Shipment } from 'src/modules/shipments/entities/shipment.entity';
  import { User } from 'src/modules/users/entities/user.entity';
  import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, OneToOne } from 'typeorm';

  @Entity('companies')
  export class Company {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    address: string;

    @Column({ unique: true })
    email: string;

    @Column()
    phone: string;

    @Column({
      type: 'enum',
      enum: SubscriptionPlan,
      default: SubscriptionPlan.FREE_TRIAL, 
    })
    subscriptionPlan: SubscriptionPlan;

    @Column({ type: 'timestamp', nullable: true })
    subscriptionExpiry: Date | null;
    
    @ManyToMany(()=> User, (user)=> user.clientOfCompanies)
    clients:User[];

    @OneToMany(()=> User, (user)=> user.driverInCompany)
    drivers?:User[];

    @OneToMany(()=>User, (officer)=> officer.officerInCompany)
    officers?:User[];

    @OneToOne(()=> User, (owner)=> owner.ownedCompany)
    owner:User;

    @OneToMany(() => Shipment, (shipment) => shipment.company)
    shipments: Shipment[]; 

    @OneToOne(()=> User, (admin)=> admin.adminInCompany)
    admin:User;


    @OneToMany(()=> Branch, (branch)=> branch.company)
    branches: Branch[]
    // @OneToMany(()=> Branch, (branch)=> branch.companyId)
    // branches: Branch[]

    @Column({nullable: true})
    logoUrl?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
  }
