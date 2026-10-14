/**
 * Formatos das respostas da API (JSON). Datas trafegam como string ISO.
 */
import type {
  PriceMode,
  ProjectStatus,
  ServiceIcon,
  UserRole,
  UserStatus,
} from './constants.js';
import type { SiteSettings } from './schemas/site-settings.js';

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  issues?: { path: string; message: string }[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isOwner: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isOwner: boolean;
  lastAccessAt: string | null;
  createdAt: string;
}

export interface ActivityDto {
  id: string;
  actorName: string;
  description: string;
  createdAt: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibleInFilter: boolean;
  position: number;
  projectCount: number;
}

export interface PhotoDto {
  id: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption: string | null;
  position: number;
}

export interface ProjectSummaryDto {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  year: number | null;
  status: ProjectStatus;
  featured: boolean;
  position: number;
  category: { id: string; name: string; slug: string };
  coverUrl: string | null;
  coverThumbUrl: string | null;
  photoCount: number;
  updatedByName: string | null;
  updatedAt: string;
}

export interface ProjectTestimonialDto {
  id: string;
  clientName: string;
  jobLabel: string | null;
  quote: string;
  rating: number;
}

export interface ProjectDetailDto extends ProjectSummaryDto {
  client: string | null;
  date: string | null;
  location: string | null;
  delivery: string | null;
  team: string | null;
  intro: string | null;
  challenge: string | null;
  approach: string | null;
  result: string | null;
  coverPhotoId: string | null;
  service: { id: string; name: string } | null;
  testimonial: ProjectTestimonialDto | null;
  photos: PhotoDto[];
}

export interface PublicProjectPageDto {
  project: ProjectDetailDto;
  next: { slug: string; title: string } | null;
}

export interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  includes: string[];
  priceMode: PriceMode;
  priceCents: number | null;
  icon: ServiceIcon;
  visible: boolean;
  position: number;
}

export interface TestimonialDto {
  id: string;
  clientName: string;
  jobLabel: string | null;
  quote: string;
  rating: number;
  visible: boolean;
  position: number;
  photoUrl: string | null;
  project: { id: string; title: string } | null;
}

export interface MessageDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  workType: string;
  desiredDate: string | null;
  message: string;
  read: boolean;
  answered: boolean;
  answeredByName: string | null;
  createdAt: string;
}

export interface MessageListDto {
  items: MessageDto[];
  unreadCount: number;
}

export interface SiteSettingsDto extends SiteSettings {
  updatedAt: string | null;
  updatedByName: string | null;
}

export interface UploadedImageDto {
  key: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
}

/** Tudo que a página inicial precisa, numa única chamada. */
export interface HomePageDto {
  settings: SiteSettings;
  categories: CategoryDto[];
  projects: ProjectSummaryDto[];
  services: ServiceDto[];
  testimonials: TestimonialDto[];
}

/** Contadores exibidos na barra lateral do painel. */
export interface AdminCountersDto {
  unreadMessages: number;
}
