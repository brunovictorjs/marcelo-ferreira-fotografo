import { slugify } from '@mf/shared';
import { ValidationError } from './domain-errors.js';

/** Value object: endereço amigável usado nas URLs públicas. */
export class Slug {
  private constructor(public readonly value: string) {}

  static fromText(text: string): Slug {
    const value = slugify(text);
    if (!value) throw new ValidationError('Não foi possível gerar o endereço a partir do texto.');
    return new Slug(value);
  }

  static restore(value: string): Slug {
    return new Slug(value);
  }

  withSuffix(n: number): Slug {
    return new Slug(`${this.value}-${n}`);
  }

  toString(): string {
    return this.value;
  }
}
