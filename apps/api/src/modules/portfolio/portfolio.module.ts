import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { CategoryUseCases } from './application/category.use-cases.js';
import { PortfolioQueries } from './application/portfolio.queries.js';
import { ProjectUseCases } from './application/project.use-cases.js';
import { CategoryRepository, ProjectRepository } from './domain/ports.js';
import { PrismaPortfolioQueries } from './infrastructure/prisma-portfolio.queries.js';
import { PrismaCategoryRepository, PrismaProjectRepository } from './infrastructure/prisma-portfolio.repositories.js';
import { CategoriesController } from './presentation/categories.controller.js';
import { PortfolioEventHandlers } from './presentation/portfolio.event-handlers.js';
import { ProjectsController, PublicProjectsController } from './presentation/projects.controller.js';

@Module({
  imports: [MediaModule],
  controllers: [CategoriesController, ProjectsController, PublicProjectsController],
  providers: [
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    { provide: ProjectRepository, useClass: PrismaProjectRepository },
    { provide: PortfolioQueries, useClass: PrismaPortfolioQueries },
    CategoryUseCases,
    ProjectUseCases,
    PortfolioEventHandlers,
  ],
  exports: [PortfolioQueries],
})
export class PortfolioModule {}
