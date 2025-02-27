import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './entities/company.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
  forwardRef(()=>AuthModule),
  TypeOrmModule.forFeature([Company]),
  
],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
