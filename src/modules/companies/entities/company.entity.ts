  import { Branch } from 'src/branches/entities/branch.entity';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
  import { Shipment } from 'src/modules/shipments/entities/shipment.entity';
import { Admin } from 'src/modules/users/entities/admins.entity';
import { Client } from 'src/modules/users/entities/client.entity';
import { CompanyOwner } from 'src/modules/users/entities/company_owner.entity';
import { Driver } from 'src/modules/users/entities/driver.entity';
import { Officer } from 'src/modules/users/entities/officers.entity';
  import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, OneToOne, JoinTable } from 'typeorm';

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
    
    @ManyToMany(()=> Client, (client)=> client.clientOfCompanies, {
      cascade:false
    })
    clients:Client[];

    @OneToMany(()=> Driver, (driver)=> driver.driverInCompany , {
      cascade:true,
    onDelete:'CASCADE'
    })
    @JoinTable()
    drivers?:Driver[];

    @OneToMany(()=>Officer, (officer)=> officer.officerInCompany, {
      cascade:true,
    onDelete:'CASCADE'
    })
    officers?:Officer[];

    @OneToOne(()=> CompanyOwner, (owner)=> owner.ownedCompany)
    owner:CompanyOwner;

    @OneToMany(() => Shipment, (shipment) => shipment.company, {
    cascade:false,
    })
    shipments: Shipment[]; 

    @OneToOne(()=> Admin, (admin)=> admin.adminInCompany, {
      cascade:true,
    onDelete:'CASCADE'
    })
    admin:Admin;


    @OneToMany(()=> Branch, (branch)=> branch.company, {
      cascade:true,
    onDelete:'CASCADE'
    })
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
