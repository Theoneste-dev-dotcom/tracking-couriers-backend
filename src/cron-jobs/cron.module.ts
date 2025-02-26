import { Module } from "@nestjs/common";
import { SubscriptionExpiryJob } from "./subscription-expiry.job";
import { CompaniesService } from "src/modules/companies/companies.service";
import { CompaniesModule } from "src/modules/companies/companies.module";

@Module({
    imports:[CompaniesModule],
    providers:[SubscriptionExpiryJob, CompaniesService]
})
export class CronModule{}