import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CompaniesModule } from '../companies/companies.module';
import { Company } from '../companies/entities/company.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports:[forwardRef(()=> AuthModule), 
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Company]),
    CompaniesModule,
    forwardRef(()=>SubscriptionModule),
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports:[UserService]
})
export class UsersModule {}