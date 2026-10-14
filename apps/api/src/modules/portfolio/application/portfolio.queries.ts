import type {
  CategoryDto,
  ProjectDetailDto,
  ProjectSummaryDto,
  PublicProjectPageDto,
} from '@mf/shared';

/**
 * Lado de leitura (CQRS): consultas otimizadas que devolvem DTOs prontos.
 * A implementação pode ler tabelas de outros módulos (serviço, depoimento)
 * apenas para montar a resposta — escritas sempre passam pelo módulo dono.
 */
export abstract class PortfolioQueries {
  abstract listCategories(options?: { onlyVisible?: boolean }): Promise<CategoryDto[]>;
  abstract listProjects(options: { categoryId?: string; onlyPublished?: boolean }): Promise<ProjectSummaryDto[]>;
  abstract getProject(id: string): Promise<ProjectDetailDto | null>;
  abstract getPublishedPage(slug: string): Promise<PublicProjectPageDto | null>;
}
