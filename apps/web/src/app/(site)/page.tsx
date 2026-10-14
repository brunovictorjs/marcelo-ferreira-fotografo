import { DEFAULT_WORK_TYPES } from '@mf/shared';
import type { Metadata } from 'next';
import { AboutSection } from '@/components/site/about-section';
import { ClientsStrip } from '@/components/site/clients-strip';
import { ContactSection } from '@/components/site/contact-section';
import { Hero } from '@/components/site/hero';
import { PortfolioSection } from '@/components/site/portfolio-section';
import { ServicesSection } from '@/components/site/services-section';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { TestimonialsSection } from '@/components/site/testimonials-section';
import { getHomePage, getPublicSettings } from '@/lib/api/public';
import { DEFAULT_IMAGES } from '@/lib/config';

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getPublicSettings();
  return {
    title: { absolute: seo.title },
    description: seo.description,
    icons: seo.faviconUrl ? { icon: seo.faviconUrl } : undefined,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'website',
      locale: 'pt_BR',
      // Sem imagem própria, usa a padrão (src/app/opengraph-image.png).
      images: [{ url: seo.shareImageUrl ?? DEFAULT_IMAGES.shareImage, width: 1200, height: 630 }],
    },
  };
}

export default async function HomePage() {
  const { settings, categories, projects, services, testimonials } = await getHomePage();
  const workTypes = services.length ? services.map((s) => s.name) : [...DEFAULT_WORK_TYPES];

  return (
    <>
      <SiteHeader ctaLabel={settings.hero.primaryButton} />
      <main>
        <Hero hero={settings.hero} />
        <ClientsStrip clients={settings.clients} />
        <PortfolioSection categories={categories} projects={projects} />
        <ServicesSection services={services} />
        <AboutSection about={settings.about} />
        <TestimonialsSection testimonials={testimonials} />
        <ContactSection contact={settings.contact} workTypes={workTypes} />
      </main>
      <SiteFooter tagline={settings.hero.tagline} />
    </>
  );
}
