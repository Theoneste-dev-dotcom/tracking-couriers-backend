import { forwardRef, Module } from "@nestjs/common";
import { CompaniesModule } from "../companies/companies.module";
import { ShipmentsModule } from "../shipments/shipments.module";
import { SubscriptionService } from "./subscription.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "../companies/entities/company.entity";
import { User } from "../users/entities/user.entity";
import { Shipment } from "../shipments/entities/shipment.entity";
import { Subscription } from "./subscription.entity";


@Module({
    imports:[
        TypeOrmModule.forFeature([Company]),
        TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([Shipment]),
        TypeOrmModule.forFeature([Subscription]),
        CompaniesModule,
        ShipmentsModule,
        forwardRef(()=>UsersModule)
    ],
    providers:[SubscriptionService],
    exports:[SubscriptionService]
})
export class SubscriptionModule {}