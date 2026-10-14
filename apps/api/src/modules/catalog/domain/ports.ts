import type { Reorderable } from '../../../shared/application/ports.js';
import type { Service } from './service.js';

export abstract class ServiceRepository implements Reorderable {
  abstract list(options?: { onlyVisible?: boolean }): Promise<Service[]>;
  abstract findById(id: string): Promise<Service | null>;
  abstract nextPosition(): Promise<number>;
  abstract save(service: Service): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(ids: string[]): Promise<void>;
}
