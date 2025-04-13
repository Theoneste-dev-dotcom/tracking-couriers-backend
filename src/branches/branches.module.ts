import { forwardRef, Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Company } from 'src/modules/companies/entities/company.entity';
import { CompaniesModule } from 'src/modules/companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch]),
    TypeOrmModule.forFeature([Company]),
    forwardRef(()=> CompaniesModule)
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
