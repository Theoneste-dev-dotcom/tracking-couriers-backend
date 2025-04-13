import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Repository } from 'typeorm';
import { CompaniesService } from 'src/modules/companies/companies.service';
import { Company } from 'src/modules/companies/entities/company.entity';

@Injectable()
export class BranchesService {

  constructor(
    @InjectRepository(Branch)
    protected readonly branchRepository: Repository<Branch>,

    @InjectRepository(Company)
    protected readonly companyRepository: Repository<Company>,
    protected readonly companyService: CompaniesService 
  ){}

  async findCompanyBranches(companyId: number) {
    let branches = await this.branchRepository.find({relations: ['company']})
    return branches.filter((branch)=> branch.company.id == companyId)
  }
 async createBranch(createBranchDto: CreateBranchDto) {
   // check if the provided company exists
   const found_company =  await this.companyRepository.findOne({where: {id: createBranchDto.companyId}});

   if(!found_company) {
    return new NotFoundException('The provided Company doesn\'t exist')
   }

   const branch_dto = {
    name: createBranchDto.name,
    location: createBranchDto.location,
    manager_name: createBranchDto.manager_name,
    email: createBranchDto.email,
    phone_number: createBranchDto.phone_number,
   }
   let branch = this.branchRepository.create(branch_dto) 

   console.log(branch)  
   branch.company = found_company

   return  await this.branchRepository.save(branch);
  }

  findAll() {
    return `This action returns all branches`;
  }

  findOne(id: number) {
    return `This action returns a #${id} branch`;
  }

  update(id: number, updateBranchDto: UpdateBranchDto) {
    return `This action updates a #${id} branch`;
  }

  remove(id: number) {
    return `This action removes a #${id} branch`;
  }
}
