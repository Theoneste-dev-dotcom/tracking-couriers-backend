import { Module } from "@nestjs/common";
import { SubscriptionExpiryJob } from "./subscription-expiry.job";
import { CompaniesService } from "src/modules/companies/companies.service";
import { CompaniesModule } from "src/modules/companies/companies.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "src/modules/companies/entities/company.entity";

@Module({
    imports:[
        CompaniesModule,
        TypeOrmModule.forFeature([Company])
    ],
    providers:[SubscriptionExpiryJob]
})
export class CronModule{}



/*
for the the entities that is accessing service of another module, 
you have to export the service, a
and in corresponding dependency impoert that module
and the service that you want to ac

*/