import { Module } from "@nestjs/common";
import { CompaniesModule } from "../companies/companies.module";
import { ShipmentsModule } from "../shipments/shipments.module";
import { SubscriptionService } from "./subscription.service";
import { AuthModule } from "../auth/auth.module";


@Module({
    imports:[
        CompaniesModule,
        ShipmentsModule,
        AuthModule
    ],
    providers:[SubscriptionService],
    exports:[SubscriptionService]
})
export class SubscriptionModule {}