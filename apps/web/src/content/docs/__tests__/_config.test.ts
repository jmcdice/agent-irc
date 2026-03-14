import { describe, it, expect } from 'vitest';
import {
  docsConfig,
  getAllDocSlugs,
  findDocBySlug,
  getFirstDocSlug,
  type DocChapter,
  type DocSection,
} from '../_config';

describe('docsConfig', () => {
  it('should have chapters with required fields', () => {
    expect(docsConfig.length).toBeGreaterThan(0);

    for (const chapter of docsConfig) {
      expect(chapter.title).toBeTruthy();
      expect(chapter.slug).toBeTruthy();
      expect(chapter.sections.length).toBeGreaterThan(0);
    }
  });

  it('should have sections with required fields', () => {
    for (const chapter of docsConfig) {
      for (const section of chapter.sections) {
        expect(section.title).toBeTruthy();
        expect(section.slug).toBeTruthy();
        expect(section.file).toBeTruthy();
        expect(section.file).toMatch(/\.md$/);
      }
    }
  });

  it('should have unique chapter slugs', () => {
    const slugs = docsConfig.map((c) => c.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it('should have unique section slugs within each chapter', () => {
    for (const chapter of docsConfig) {
      const slugs = chapter.sections.map((s) => s.slug);
      const uniqueSlugs = new Set(slugs);
      expect(slugs.length).toBe(uniqueSlugs.size);
    }
  });
});

describe('getAllDocSlugs', () => {
  it('should return an array of slug pairs', () => {
    const slugs = getAllDocSlugs();

    expect(Array.isArray(slugs)).toBe(true);
    expect(slugs.length).toBeGreaterThan(0);

    for (const slug of slugs) {
      expect(Array.isArray(slug)).toBe(true);
      expect(slug.length).toBe(2);
      expect(typeof slug[0]).toBe('string');
      expect(typeof slug[1]).toBe('string');
    }
  });

  it('should include all sections from all chapters', () => {
    const slugs = getAllDocSlugs();

    let expectedCount = 0;
    for (const chapter of docsConfig) {
      expectedCount += chapter.sections.length;
    }

    expect(slugs.length).toBe(expectedCount);
  });

  it('should return slugs in correct format [chapter, section]', () => {
    const slugs = getAllDocSlugs();
    const firstChapter = docsConfig[0];
    const firstSection = firstChapter.sections[0];

    expect(slugs[0]).toEqual([firstChapter.slug, firstSection.slug]);
  });
});

describe('findDocBySlug', () => {
  it('should find a document by valid slug path', () => {
    const firstChapter = docsConfig[0];
    const firstSection = firstChapter.sections[0];

    const result = findDocBySlug([firstChapter.slug, firstSection.slug]);

    expect(result).not.toBeNull();
    expect(result!.chapter.slug).toBe(firstChapter.slug);
    expect(result!.section.slug).toBe(firstSection.slug);
  });

  it('should return null for invalid slug path', () => {
    expect(findDocBySlug(['nonexistent', 'path'])).toBeNull();
    expect(findDocBySlug(['getting-started', 'nonexistent'])).toBeNull();
  });

  it('should return null for wrong number of slug segments', () => {
    expect(findDocBySlug([])).toBeNull();
    expect(findDocBySlug(['only-one'])).toBeNull();
    expect(findDocBySlug(['too', 'many', 'segments'])).toBeNull();
  });

  it('should return null prevDoc for first document', () => {
    const firstChapter = docsConfig[0];
    const firstSection = firstChapter.sections[0];

    const result = findDocBySlug([firstChapter.slug, firstSection.slug]);

    expect(result).not.toBeNull();
    expect(result!.prevDoc).toBeNull();
    expect(result!.nextDoc).not.toBeNull();
  });

  it('should return null nextDoc for last document', () => {
    const lastChapter = docsConfig[docsConfig.length - 1];
    const lastSection = lastChapter.sections[lastChapter.sections.length - 1];

    const result = findDocBySlug([lastChapter.slug, lastSection.slug]);

    expect(result).not.toBeNull();
    expect(result!.prevDoc).not.toBeNull();
    expect(result!.nextDoc).toBeNull();
  });

  it('should return correct prev/next for middle document', () => {
    // Get second section of first chapter
    const firstChapter = docsConfig[0];
    if (firstChapter.sections.length < 2) {
      // Skip if not enough sections
      return;
    }

    const secondSection = firstChapter.sections[1];
    const result = findDocBySlug([firstChapter.slug, secondSection.slug]);

    expect(result).not.toBeNull();
    expect(result!.prevDoc).not.toBeNull();
    expect(result!.prevDoc!.section).toBe(firstChapter.sections[0].slug);
    expect(result!.nextDoc).not.toBeNull();
  });
});

describe('getFirstDocSlug', () => {
  it('should return the first chapter and section slugs', () => {
    const result = getFirstDocSlug();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    const firstChapter = docsConfig[0];
    const firstSection = firstChapter.sections[0];

    expect(result[0]).toBe(firstChapter.slug);
    expect(result[1]).toBe(firstSection.slug);
  });
});

