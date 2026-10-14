import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { HOME_TESTIMONIALS_LIMIT, type HomePageDto } from '@mf/shared';
import { Public } from '../../shared/presentation/auth.decorators.js';
import { ServiceUseCases } from '../catalog/application/service.use-cases.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { PortfolioQueries } from '../portfolio/application/portfolio.queries.js';
import { PortfolioModule } from '../portfolio/portfolio.module.js';
import { SiteSettingsUseCases } from '../site-settings/application/site-settings.use-cases.js';
import { SiteSettingsModule } from '../site-settings/site-settings.module.js';
import { TestimonialUseCases } from '../testimonials/application/testimonial.use-cases.js';
import { TestimonialsModule } from '../testimonials/testimonials.module.js';

/**
 * Composição de leitura para o site público: junta as fachadas dos módulos
 * numa única resposta, para a página inicial fazer uma só requisição.
 */
@Injectable()
export class PublicSiteQuery {
  constructor(
    private readonly settings: SiteSettingsUseCases,
    private readonly portfolio: PortfolioQueries,
    private readonly services: ServiceUseCases,
    private readonly testimonials: TestimonialUseCases,
  ) {}

  async home(): Promise<HomePageDto> {
    const [settings, categories, projects, services, testimonials] = await Promise.all([
      this.settings.getPublic(),
      this.portfolio.listCategories({ onlyVisible: true }),
      this.portfolio.listProjects({ onlyPublished: true }),
      this.services.list(true),
      this.testimonials.list('visible', HOME_TESTIMONIALS_LIMIT),
    ]);
    return { settings, categories, projects, services, testimonials };
  }
}

@Public()
@Controller('public')
export class PublicSiteController {
  constructor(
    private readonly query: PublicSiteQuery,
    private readonly settings: SiteSettingsUseCases,
  ) {}

  @Get('home')
  home() {
    return this.query.home();
  }

  /** Configurações (SEO, contato) para o layout e os metadados das páginas. */
  @Get('settings')
  siteSettings() {
    return this.settings.getPublic();
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Module({
  imports: [SiteSettingsModule, PortfolioModule, CatalogModule, TestimonialsModule],
  controllers: [PublicSiteController],
  providers: [PublicSiteQuery],
})
export class PublicSiteModule {}
