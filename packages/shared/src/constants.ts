export const USER_ROLES = ['ADMIN', 'EDITOR'] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const USER_ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
};

export const USER_STATUSES = ['ACTIVE', 'INVITED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PROJECT_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PRICE_MODES = ['FROM', 'FIXED', 'ON_REQUEST'] as const;
export type PriceMode = (typeof PRICE_MODES)[number];
export const PRICE_MODE_LABEL: Record<PriceMode, string> = {
  FROM: 'A partir de',
  FIXED: 'Valor fixo',
  ON_REQUEST: 'Sob consulta',
};

export const SERVICE_ICONS = ['PERSON', 'RINGS', 'BRIEFCASE', 'FOCUS', 'CAMERA'] as const;
export type ServiceIcon = (typeof SERVICE_ICONS)[number];
export const SERVICE_ICON_LABEL: Record<ServiceIcon, string> = {
  PERSON: 'Pessoa',
  RINGS: 'Alianças',
  BRIEFCASE: 'Maleta',
  FOCUS: 'Foco',
  CAMERA: 'Câmera',
};

export const MESSAGE_FILTERS = ['all', 'pending', 'answered'] as const;
export type MessageFilter = (typeof MESSAGE_FILTERS)[number];

export const TESTIMONIAL_QUOTE_MAX = 280;
export const ABOUT_CHIPS_MAX = 4;
export const ABOUT_CHIP_MAX_LENGTH = 28;
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;
export const HOME_TESTIMONIALS_LIMIT = 12;

export const IMAGE_MAX_BYTES = 20 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/webp', 'image/png', 'image/svg+xml'] as const;

/** Opções do campo "Tipo de trabalho" quando não há serviços cadastrados. */
export const DEFAULT_WORK_TYPES = [
  'Retratos e ensaios',
  'Casamentos e eventos',
  'Corporativo e marcas',
  'Produto e gastronomia',
] as const;
