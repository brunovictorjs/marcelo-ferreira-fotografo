import type { TestimonialDto } from '@mf/shared';
import { Reveal } from '@/components/motion/reveal';
import { SectionHeading } from './section-heading';
import { TestimonialsCarousel } from './testimonials-carousel';

export function TestimonialsSection({ testimonials }: { testimonials: TestimonialDto[] }) {
  if (testimonials.length === 0) return null;
  return (
    <Reveal as="section" id="depoimentos" className="section-container flex scroll-mt-20 flex-col gap-12 py-24 lg:py-32">
      <SectionHeading index="04" eyebrow="Depoimentos" title="Quem já fotografou" />
      <TestimonialsCarousel testimonials={testimonials} />
    </Reveal>
  );
}
