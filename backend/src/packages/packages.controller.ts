import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { PackageResponseDto } from './dto/package-response.dto';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo pacote' })
  @ApiResponse({
    status: 201,
    description: 'Pacote criado com sucesso',
    type: PackageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createPackageDto: CreatePackageDto): Promise<PackageResponseDto> {
    return this.packagesService.create(createPackageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pacotes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacotes retornada com sucesso',
    type: [PackageResponseDto],
  })
  findAll(@Query() query: QueryPackageDto): Promise<PackageResponseDto[]> {
    return this.packagesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pacote por ID' })
  @ApiResponse({
    status: 200,
    description: 'Pacote encontrado',
    type: PackageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pacote não encontrado' })
  findOne(@Param('id') id: string): Promise<PackageResponseDto> {
    return this.packagesService.findOne(id);
  }

  @Get(':id/subscriptions/count')
  @ApiOperation({ summary: 'Contar assinaturas ativas do pacote' })
  @ApiResponse({
    status: 200,
    description: 'Contagem retornada com sucesso',
  })
  countActiveSubscriptions(@Param('id') id: string): Promise<number> {
    return this.packagesService.countActiveSubscriptions(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar pacote' })
  @ApiResponse({
    status: 200,
    description: 'Pacote atualizado com sucesso',
    type: PackageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pacote não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  update(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ): Promise<PackageResponseDto> {
    return this.packagesService.update(id, updatePackageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar pacote (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Pacote desativado com sucesso',
    type: PackageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pacote não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Pacote possui assinaturas ativas',
  })
  deactivate(@Param('id') id: string): Promise<PackageResponseDto> {
    return this.packagesService.deactivate(id);
  }
}
