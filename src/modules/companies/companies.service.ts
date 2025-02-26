import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const existingCompany = await this.companyRepository.findOne({ where: { email: createCompanyDto.email } });

    if (existingCompany) {
      throw new BadRequestException('A company with this email already exists');
    }

    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
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

  async update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
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

  async findCompany(id:number):Promise<Company> {
    const companyFound = await this.companyRepository.findOne({where: {id}})
    if (!companyFound) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return companyFound
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
}
