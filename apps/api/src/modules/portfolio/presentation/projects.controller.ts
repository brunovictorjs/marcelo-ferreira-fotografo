import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  IMAGE_MAX_BYTES,
  photoUpdateSchema,
  projectFeaturedSchema,
  projectSchema,
  type ReorderInput,
  reorderSchema,
} from '@mf/shared';
import type { z } from 'zod';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { ValidationError } from '../../../shared/domain/domain-errors.js';
import { CurrentActor, Public } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import { ProjectUseCases } from '../application/project.use-cases.js';

type ProjectBody = z.output<typeof projectSchema>;

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectUseCases) {}

  @Get()
  list(@Query('categoryId') categoryId?: string) {
    return this.projects.list(categoryId || undefined);
  }

  @Post()
  create(@Body(new ZodValidationPipe(projectSchema)) body: ProjectBody, @CurrentActor() actor: Actor) {
    return this.projects.create(body, actor);
  }

  @Put('order')
  @HttpCode(204)
  async reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput, @CurrentActor() actor: Actor) {
    await this.projects.reorder(body.ids, actor);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.projects.detail(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(projectSchema)) body: ProjectBody,
    @CurrentActor() actor: Actor,
  ) {
    return this.projects.update(id, body, actor);
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.projects.publish(id, actor);
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  unpublish(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.projects.unpublish(id, actor);
  }

  @Patch(':id/featured')
  @HttpCode(204)
  async featured(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(projectFeaturedSchema)) body: { featured: boolean },
    @CurrentActor() actor: Actor,
  ) {
    await this.projects.setFeatured(id, body.featured, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    await this.projects.delete(id, actor);
  }

  // ── Galeria ────────────────────────────────────────────────────────────────

  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('files', 40, { limits: { fileSize: IMAGE_MAX_BYTES } }))
  addPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @CurrentActor() actor: Actor,
  ) {
    if (!files?.length) throw new ValidationError('Nenhuma foto enviada.', 'FILE_REQUIRED');
    return this.projects.addPhotos(id, files, actor);
  }

  @Put(':id/photos/order')
  reorderPhotos(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput,
    @CurrentActor() actor: Actor,
  ) {
    return this.projects.reorderPhotos(id, body.ids, actor);
  }

  @Patch(':id/photos/:photoId')
  @HttpCode(204)
  async caption(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Body(new ZodValidationPipe(photoUpdateSchema)) body: { caption: string | null },
    @CurrentActor() actor: Actor,
  ) {
    await this.projects.captionPhoto(id, photoId, body.caption, actor);
  }

  @Post(':id/photos/:photoId/cover')
  @HttpCode(200)
  cover(@Param('id') id: string, @Param('photoId') photoId: string, @CurrentActor() actor: Actor) {
    return this.projects.setCover(id, photoId, actor);
  }

  @Delete(':id/photos/:photoId')
  removePhoto(@Param('id') id: string, @Param('photoId') photoId: string, @CurrentActor() actor: Actor) {
    return this.projects.removePhoto(id, photoId, actor);
  }
}

/** Página pública de um projeto publicado. */
@Public()
@Controller('public/projects')
export class PublicProjectsController {
  constructor(private readonly projects: ProjectUseCases) {}

  @Get(':slug')
  page(@Param('slug') slug: string) {
    return this.projects.publicPage(slug);
  }
}
