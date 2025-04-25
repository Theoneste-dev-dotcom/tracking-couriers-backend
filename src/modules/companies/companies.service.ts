import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { removeAllListeners } from 'process';
import { Shipment } from '../shipments/entities/shipment.entity';
import { User } from '../users/entities/user.entity';
import { AssignOwner } from '../users/dto/assign-owner.dto';
import { Role } from 'src/common/enums/role.enum';
import { CompanyOwner } from '../users/entities/company_owner.entity';
import { UserService } from '../users/users.service';

@Injectable()
export class CompaniesService {
 
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    //injecting the user repository
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(CompanyOwner)
    private readonly companyOwnerRepository: Repository<CompanyOwner>,

    private readonly userService: UserService

  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    current_user
  ): Promise<CompanyResponseDto> {
    const existingCompany = await this.companyRepository.findOne({
      where: { email: createCompanyDto.email },
    });
   
    if (existingCompany) {
      throw new BadRequestException('A company with this email already exists');
    }

    if(current_user.role !== 'company_owner'){
      throw new BadRequestException('Only owners are able to create companies');
    }

    const company1 =  this.companyRepository.create(createCompanyDto);

 
    const company = await  this.companyRepository.save(company1);
    await this.assignCompanyOwner(company.id, current_user.email)
   return company
  }



  async findAll(): Promise<CompanyResponseDto[]> {
    return this.companyRepository.find();
  }

  async findOne(id: number): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const company = await this.findOne(id);

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    try {
      await this.companyRepository.update(id, updateCompanyDto);
      return this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update company');
    }
  }


  async findCompany(id: number): Promise<Company> {
    const companyFound = await this.companyRepository.findOne({
      where: { id },
    });
    if (!companyFound) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return companyFound;
  }
  async remove(id: number): Promise<void> {
    const company = await this.findCompany(id);

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    try {
      await this.companyRepository.remove(company);
    } catch (error) {
      throw new InternalServerErrorException('Failed to remove company');
    }
  }

  async assignCompanyOwner(companyId:number, userEmail:string) : Promise<void> {
    const company = await this.companyRepository.findOne({where: {id:companyId}});
    if(!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // verify user exists and is a company owner
    const user = await this.userRepository.findOne({where: {email: userEmail}})

    if(!user) {
      throw new NotFoundException(`User with ID ${userEmail} not found or is not a company owner`);
    }

    // if(user.ownedCompany) {
    //   throw new ConflictException(`User already owns company ID ${user.ownedCompany.id}`);
    // }

    if(company.owner) {
      throw new ConflictException(`Company already has an owner ${company.owner.id}` );

    }
   

   const company_owner = await this.userService.createCompanyOwner(user, companyId)

    await this.companyRepository.manager.transaction(
      async (transactionalEntityManager) => {
        company.owner = company_owner;
        await transactionalEntityManager.save(company);
        // user.ownedCompany = company;
        await transactionalEntityManager.save(user);
      }
    )
  }

  async initializeCompany(companyId: number): Promise<Company> {
    const company = await this.findCompany(companyId);

    // set a 2-weeks trial period for new companies
    const now = new Date();
    const expiryDate = new Date(now.setDate(now.getDate() + 14));

    company.subscriptionPlan = SubscriptionPlan.FREE_TRIAL;
    company.subscriptionExpiry = expiryDate;

    return this.companyRepository.save(company);
  }

  async updateSubscription(
    companyId: number,
    plan: SubscriptionPlan,
  ): Promise<Company> {
    const company = await this.findCompany(companyId);

    let expiryDate: Date | null;
    const now = new Date();

    switch (plan) {
      case SubscriptionPlan.BASIC:
        expiryDate = new Date(now.setMonth(now.getMonth() + 1)); // 1 month
        break;

      case SubscriptionPlan.PREMIUM:
        expiryDate = new Date(now.setMonth(now.getMonth() + 6)); // 6 months
        break;

      case SubscriptionPlan.FREE_TRIAL:
        expiryDate = new Date(now.setDate(now.getDate() + 14)); // 2 weeks
        break;
      case SubscriptionPlan.EXPIRED:
      default:
        expiryDate = null; // no expry for expired accounts
    }

    company.subscriptionPlan = plan;
    company.subscriptionExpiry = expiryDate;

    return this.companyRepository.save(company);
  }

  async checkSubscriptionStatus(
    companyId: number,
  ): Promise<{ status: string; daysLeft?: number }> {
    const company = await this.findCompany(companyId);
    if (!company.subscriptionExpiry) {
      return { status: 'expired' };
    }

    const now = new Date();
    const remainingTime = company.subscriptionExpiry.getTime() - now.getTime();
    const daysLeft = Math.floor(remainingTime / (1000 * 60 * 60 * 24)); // convert ms to days

    if (remainingTime <= 0) {
      return { status: 'expired' };
    }

    return { status: 'active', daysLeft };
  }

  async expireSubscriptions(): Promise<void> {
    const now = new Date();
    await this.companyRepository.update(
      {
        subscriptionExpiry: LessThan(now),
        subscriptionPlan: SubscriptionPlan.FREE_TRIAL,
      },
      { subscriptionPlan: SubscriptionPlan.EXPIRED, subscriptionExpiry: null },
    );
  }

   // Method to fetch shipments related to a specific company
   async getShipmentsByCompanyId(companyId: number): Promise<Shipment[]> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['shipments'], // Fetch related shipments
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return company.shipments; // Return the shipments associated with the company
  }

//   async getCompanyUsers(companyId: number): Promise<User[]> {
//       const company = await this.companyRepository.findOne({
//         where: { id: companyId },
//         relations: [
//           'owner',        // Company owner (OneToOne)
//           'drivers',      // List of drivers (OneToMany)
//           'officers',     // List of officers (OneToMany)
//           'clients'       // List of clients (ManyToMany)
//         ],
//       });
    
//       if (!company) {
//         throw new NotFoundException(`Company with ID ${companyId} not found`);
//       }
    
//       // Combine all user types and filter duplicates
//       const allUsers = [
//         company.owner,      // Owner is a single user
//         ...(company.drivers ?? []), 
//         ...(company.officers ?? []),
//         ...(company.clients ?? [])
//       ].filter(Boolean);    // Remove undefined/null values
    
//       // Remove duplicate users based on ID
//       const uniqueUsers = allUsers.reduce((acc: User[], current: User) => {
//         if (!acc.some(user => user.id === current.id)) {
//           acc.push(current);
//         }
//         return acc;
//       }, []);
    
//       return uniqueUsers;
//     }

}


