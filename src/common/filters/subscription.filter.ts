import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';

@Catch(HttpException)
export class SubscriptionFilter extends BaseExceptionFilter {
  constructor(private subscriptionService: SubscriptionService) {
    super();
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const request = ctx.getRequest();

    if (status === HttpStatus.FORBIDDEN) {
      if (request.user && request.user.sub) {
        const userId = request.user.sub;
        const user = await this.subscriptionService.getUserWithCompany(userId);
    //     if (user && user.clientOfCompanies && user.clientOfCompanies.length > 0) {
    //       const company = user.clientOfCompanies[0];
    //       if (!await this.subscriptionService.isSubscriptionValid(company)) {
    //         response.status(HttpStatus.FORBIDDEN).json({
    //           statusCode: HttpStatus.FORBIDDEN,
    //           message: 'Subscription expired or is not valid.',
    //         });
    //         return;
    //       }

    //       if (!await this.subscriptionService.checkShipmentLimit(company.id)) {
    //         response.status(HttpStatus.FORBIDDEN).json({
    //           statusCode: HttpStatus.FORBIDDEN,
    //           message: 'Shipment limit exceeded for your subscription.',
    //         });
    //         return;
    //       }

    //       if (!await this.subscriptionService.checkDriverLimit(company.id)) {
    //         response.status(HttpStatus.FORBIDDEN).json({
    //             statusCode: HttpStatus.FORBIDDEN,
    //             message: "Driver limit exceeded for your subscription"
    //         })
    //         return;
    //       }
    //     }
    return
      }
    }
    super.catch(exception, host);
  }
}