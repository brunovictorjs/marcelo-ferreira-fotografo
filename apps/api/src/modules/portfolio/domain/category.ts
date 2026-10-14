import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { ConflictError } from '../../../shared/domain/domain-errors.js';
import { AggregateRoot, newId } from '../../../shared/domain/entity.js';
import { Slug } from '../../../shared/domain/slug.js';

export interface CategoryProps {
  name: string;
  slug: string;
  description: string | null;
  visibleInFilter: boolean;
  position: number;
}

export interface CategoryData {
  name: string;
  description: string | null;
  visibleInFilter: boolean;
}

/** Categoria do portfólio: vira um botão de filtro no site. */
export class Category extends AggregateRoot<CategoryProps> {
  static restore(id: string, props: CategoryProps): Category {
    return new Category(id, props);
  }

  static create(data: CategoryData, slug: Slug, position: number, actor: Actor): Category {
    const category = new Category(newId(), { ...data, slug: slug.value, position });
    category.record(domainEvent('portfolio.category.created', actor, { categoryId: category.id, name: data.name }));
    return category;
  }

  get name() { return this.props.name; }
  get slug() { return Slug.restore(this.props.slug); }

  update(data: CategoryData, slug: Slug, actor: Actor): void {
    Object.assign(this.props, data, { slug: slug.value });
    this.record(domainEvent('portfolio.category.updated', actor, { categoryId: this.id, name: data.name }));
  }

  /** Regra do protótipo: só exclui sem projetos — ocultar o filtro mantém os projetos no site. */
  markDeletedBy(actor: Actor, projectCount: number): void {
    if (projectCount > 0) {
      throw new ConflictError('Mova os projetos desta categoria antes de excluir.', 'CATEGORY_HAS_PROJECTS');
    }
    this.record(domainEvent('portfolio.category.deleted', actor, { categoryId: this.id, name: this.name }));
  }
}
