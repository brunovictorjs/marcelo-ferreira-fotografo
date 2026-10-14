import { Module } from '@nestjs/common';
import { ServiceUseCases } from './application/service.use-cases.js';
import { ServiceRepository } from './domain/ports.js';
import { PrismaServiceRepository } from './infrastructure/prisma-service.repository.js';
import { ServicesController } from './presentation/services.controller.js';

@Module({
  controllers: [ServicesController],
  providers: [{ provide: ServiceRepository, useClass: PrismaServiceRepository }, ServiceUseCases],
  exports: [ServiceUseCases],
})
export class CatalogModule {}
