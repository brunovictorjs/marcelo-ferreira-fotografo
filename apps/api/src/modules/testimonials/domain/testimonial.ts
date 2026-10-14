import { TESTIMONIAL_QUOTE_MAX } from '@mf/shared';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { ValidationError } from '../../../shared/domain/domain-errors.js';
import { AggregateRoot, newId } from '../../../shared/domain/entity.js';
import type { Reorderable } from '../../../shared/application/ports.js';

export interface TestimonialData {
  clientName: string;
  jobLabel: string | null;
  quote: string;
  rating: number;
  projectId: string | null;
  photoUrl: string | null;
  visible: boolean;
}

export interface TestimonialProps extends TestimonialData {
  position: number;
}

/** Depoimento de cliente (prova social). */
export class Testimonial extends AggregateRoot<TestimonialProps> {
  static restore(id: string, props: TestimonialProps): Testimonial {
    return new Testimonial(id, props);
  }

  static create(data: TestimonialData, position: number, actor: Actor): Testimonial {
    Testimonial.validate(data);
    const t = new Testimonial(newId(), { ...data, position });
    t.record(domainEvent('testimonials.testimonial.created', actor, { testimonialId: t.id, clientName: data.clientName }));
    return t;
  }

  get clientName() { return this.props.clientName; }
  get photoUrl() { return this.props.photoUrl; }

  update(data: TestimonialData, actor: Actor): void {
    Testimonial.validate(data);
    Object.assign(this.props, data);
    this.record(domainEvent('testimonials.testimonial.updated', actor, { testimonialId: this.id, clientName: this.clientName }));
  }

  setVisible(visible: boolean, actor: Actor): void {
    this.props.visible = visible;
    this.record(
      domainEvent(visible ? 'testimonials.testimonial.shown' : 'testimonials.testimonial.hidden', actor, {
        testimonialId: this.id,
        clientName: this.clientName,
      }),
    );
  }

  markDeletedBy(actor: Actor): void {
    this.record(domainEvent('testimonials.testimonial.deleted', actor, { testimonialId: this.id, clientName: this.clientName }));
  }

  private static validate(data: TestimonialData): void {
    if (data.quote.length > TESTIMONIAL_QUOTE_MAX) {
      throw new ValidationError(`O depoimento pode ter até ${TESTIMONIAL_QUOTE_MAX} caracteres.`, 'QUOTE_TOO_LONG');
    }
    if (data.rating < 1 || data.rating > 5) throw new ValidationError('A nota vai de 1 a 5 estrelas.', 'INVALID_RATING');
  }
}

export abstract class TestimonialRepository implements Reorderable {
  abstract findById(id: string): Promise<Testimonial | null>;
  abstract nextPosition(): Promise<number>;
  abstract save(testimonial: Testimonial): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(ids: string[]): Promise<void>;
  /** Mantém no máximo um depoimento por projeto. */
  abstract linkToProject(projectId: string, testimonialId: string | null): Promise<void>;
  abstract unlinkProject(projectId: string): Promise<void>;
}
