import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CompaniesModule } from '../companies/companies.module';
import { Company } from '../companies/entities/company.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { Admin } from './entities/admins.entity';
import { Driver } from './entities/driver.entity';
import { Officer } from './entities/officers.entity';
import { CompanyOwner } from './entities/company_owner.entity';
import { Client } from './entities/client.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports:[forwardRef(()=> AuthModule), 
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Admin]),
    TypeOrmModule.forFeature([Driver]),
    TypeOrmModule.forFeature([Officer]),
    TypeOrmModule.forFeature([Client]),
    TypeOrmModule.forFeature([CompanyOwner]),
    TypeOrmModule.forFeature([Company]),
    forwardRef(()=>CompaniesModule),
    forwardRef(()=>SubscriptionModule),
    EventEmitterModule.forRoot()
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports:[UserService]
})
export class UsersModule {}