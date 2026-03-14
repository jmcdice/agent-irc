/**
 * Documentation Configuration
 *
 * This file defines the structure of the documentation navigation.
 * Update this file when adding, removing, or reorganizing documentation.
 */

export interface DocSection {
  title: string;
  slug: string;
  file: string;
}

export interface DocChapter {
  title: string;
  slug: string;
  sections: DocSection[];
}

export const docsConfig: DocChapter[] = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    sections: [
      { title: 'Introduction', slug: 'introduction', file: '01-getting-started/01-introduction.md' },
      { title: 'Quick Start', slug: 'quick-start', file: '01-getting-started/02-quick-start.md' },
      { title: 'Project Structure', slug: 'project-structure', file: '01-getting-started/03-project-structure.md' },
      { title: 'Development Commands', slug: 'dev-commands', file: '01-getting-started/04-dev-commands.md' },
    ],
  },
  {
    title: 'Architecture',
    slug: 'architecture',
    sections: [
      { title: 'Overview', slug: 'overview', file: '02-architecture/01-overview.md' },
      { title: 'Monorepo Structure', slug: 'monorepo-structure', file: '02-architecture/02-monorepo-structure.md' },
      { title: 'Shared Packages', slug: 'shared-packages', file: '02-architecture/03-shared-packages.md' },
      { title: 'Docker Setup', slug: 'docker-setup', file: '02-architecture/04-docker-setup.md' },
    ],
  },
  {
    title: 'Frontend',
    slug: 'frontend',
    sections: [
      { title: 'Next.js Overview', slug: 'nextjs-overview', file: '03-frontend/01-nextjs-overview.md' },
      { title: 'Components', slug: 'components', file: '03-frontend/02-components.md' },
      { title: 'Custom Hooks', slug: 'hooks', file: '03-frontend/03-hooks.md' },
      { title: 'Theming', slug: 'theming', file: '03-frontend/04-theming.md' },
      { title: 'State Management', slug: 'state-management', file: '03-frontend/05-state-management.md' },
    ],
  },
  {
    title: 'Backend',
    slug: 'backend',
    sections: [
      { title: 'Express Overview', slug: 'express-overview', file: '04-backend/01-express-overview.md' },
      { title: 'Database', slug: 'database', file: '04-backend/02-database.md' },
      { title: 'API Routes', slug: 'api-routes', file: '04-backend/03-api-routes.md' },
      { title: 'Middleware', slug: 'middleware', file: '04-backend/04-middleware.md' },
      { title: 'Error Handling', slug: 'error-handling', file: '04-backend/05-error-handling.md' },
    ],
  },
  {
    title: 'Authentication',
    slug: 'authentication',
    sections: [
      { title: 'Overview', slug: 'overview', file: '05-authentication/01-overview.md' },
      { title: 'Sessions', slug: 'sessions', file: '05-authentication/02-sessions.md' },
      { title: 'Password Flows', slug: 'password-flows', file: '05-authentication/03-password-flows.md' },
      { title: 'Role-Based Access Control', slug: 'rbac', file: '05-authentication/04-rbac.md' },
    ],
  },
  {
    title: 'Security',
    slug: 'security',
    sections: [
      { title: 'CORS', slug: 'cors', file: '06-security/01-cors.md' },
      { title: 'Security Headers', slug: 'headers', file: '06-security/02-headers.md' },
      { title: 'Input Validation', slug: 'input-validation', file: '06-security/03-input-validation.md' },
      { title: 'Environment Security', slug: 'environment', file: '06-security/04-environment.md' },
    ],
  },
  {
    title: 'Deployment',
    slug: 'deployment',
    sections: [
      { title: 'Docker', slug: 'docker', file: '07-deployment/01-docker.md' },
      { title: 'Production Checklist', slug: 'production-checklist', file: '07-deployment/02-production-checklist.md' },
      { title: 'Environment Variables', slug: 'environment-variables', file: '07-deployment/03-environment-variables.md' },
    ],
  },
  {
    title: 'Testing',
    slug: 'testing',
    sections: [
      { title: 'Overview', slug: 'overview', file: '08-testing/01-overview.md' },
      { title: 'Unit Tests', slug: 'unit-tests', file: '08-testing/02-unit-tests.md' },
      { title: 'Integration Tests', slug: 'integration-tests', file: '08-testing/03-integration-tests.md' },
    ],
  },
  {
    title: 'Extending App Shell',
    slug: 'extending',
    sections: [
      { title: 'Adding Features', slug: 'adding-features', file: '09-extending/01-adding-features.md' },
      { title: 'Customization', slug: 'customization', file: '09-extending/02-customization.md' },
      { title: 'Best Practices', slug: 'best-practices', file: '09-extending/03-best-practices.md' },
    ],
  },
  {
    title: 'Reference',
    slug: 'reference',
    sections: [
      { title: 'API Reference', slug: 'api-reference', file: '10-reference/01-api-reference.md' },
      { title: 'Component Reference', slug: 'component-reference', file: '10-reference/02-component-reference.md' },
      { title: 'Hook Reference', slug: 'hook-reference', file: '10-reference/03-hook-reference.md' },
      { title: 'Theme Guide', slug: 'theme-guide', file: '10-reference/04-theme-guide.md' },
      { title: 'Documentation Guide', slug: 'documentation-guide', file: '10-reference/05-documentation-guide.md' },
    ],
  },
];

/**
 * Get all documentation slugs for static generation
 */
export function getAllDocSlugs(): string[][] {
  const slugs: string[][] = [];

  for (const chapter of docsConfig) {
    for (const section of chapter.sections) {
      slugs.push([chapter.slug, section.slug]);
    }
  }

  return slugs;
}

/**
 * Find a document by its slug path
 */
export function findDocBySlug(slugPath: string[]): {
  chapter: DocChapter;
  section: DocSection;
  prevDoc: { chapter: string; section: string; title: string } | null;
  nextDoc: { chapter: string; section: string; title: string } | null;
} | null {
  if (slugPath.length !== 2) return null;

  const [chapterSlug, sectionSlug] = slugPath;

  // Find all sections in flat order for prev/next navigation
  const allSections: Array<{ chapter: DocChapter; section: DocSection }> = [];
  for (const chapter of docsConfig) {
    for (const section of chapter.sections) {
      allSections.push({ chapter, section });
    }
  }

  const currentIndex = allSections.findIndex(
    (item) => item.chapter.slug === chapterSlug && item.section.slug === sectionSlug
  );

  if (currentIndex === -1) return null;

  const current = allSections[currentIndex];
  const prev = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const next = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null;

  return {
    chapter: current.chapter,
    section: current.section,
    prevDoc: prev
      ? { chapter: prev.chapter.slug, section: prev.section.slug, title: prev.section.title }
      : null,
    nextDoc: next
      ? { chapter: next.chapter.slug, section: next.section.slug, title: next.section.title }
      : null,
  };
}

/**
 * Get the first documentation page (for redirects)
 */
export function getFirstDocSlug(): string[] {
  const firstChapter = docsConfig[0];
  const firstSection = firstChapter.sections[0];
  return [firstChapter.slug, firstSection.slug];
}

