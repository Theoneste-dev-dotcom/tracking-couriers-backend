import { forwardRef, Module } from "@nestjs/common";
import { CompaniesModule } from "../companies/companies.module";
import { ShipmentsModule } from "../shipments/shipments.module";
import { SubscriptionService } from "./subscription.service";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";


@Module({
    imports:[
        CompaniesModule,
        ShipmentsModule,
        forwardRef(()=>UsersModule)
    ],
    providers:[SubscriptionService],
    exports:[SubscriptionService]
})
export class SubscriptionModule {}