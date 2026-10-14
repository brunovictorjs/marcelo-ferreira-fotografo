import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { TestimonialQueries, TestimonialUseCases } from './application/testimonial.use-cases.js';
import { TestimonialRepository } from './domain/testimonial.js';
import { PrismaTestimonialQueries, PrismaTestimonialRepository } from './infrastructure/prisma-testimonials.js';
import { TestimonialEventHandlers, TestimonialsController } from './presentation/testimonials.controller.js';

@Module({
  imports: [MediaModule],
  controllers: [TestimonialsController],
  providers: [
    { provide: TestimonialRepository, useClass: PrismaTestimonialRepository },
    { provide: TestimonialQueries, useClass: PrismaTestimonialQueries },
    TestimonialUseCases,
    TestimonialEventHandlers,
  ],
  exports: [TestimonialUseCases],
})
export class TestimonialsModule {}
