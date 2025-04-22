import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { Branch } from 'src/branches/entities/branch.entity';
import { BranchesModule } from 'src/branches/branches.module';
import { CompanyOwner } from '../users/entities/company_owner.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
  forwardRef(()=>AuthModule),
  TypeOrmModule.forFeature([Company]),
  TypeOrmModule.forFeature([User]),
  TypeOrmModule.forFeature([Branch]),
  TypeOrmModule.forFeature([CompanyOwner]),
  forwardRef(() => AuthModule),
  forwardRef(()=> BranchesModule),
  forwardRef(()=> UsersModule),
 

],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
