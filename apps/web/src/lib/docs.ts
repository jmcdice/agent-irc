import fs from 'fs';
import path from 'path';

const DOCS_DIRECTORY = path.join(process.cwd(), 'src/content/docs');

/**
 * Read a markdown documentation file by its relative path
 */
export function getDocContent(filePath: string): string {
  const fullPath = path.join(DOCS_DIRECTORY, filePath);

  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read documentation file: ${fullPath}`, error);
    return `# Document Not Found\n\nThe documentation file "${filePath}" could not be found.`;
  }
}

/**
 * Extract frontmatter and content from markdown
 * (Simple implementation - can be enhanced with gray-matter if needed)
 */
export function parseMarkdown(content: string): {
  title: string;
  content: string;
} {
  // Extract title from first h1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Documentation';

  return { title, content };
}

/**
 * Check if a documentation file exists
 */
export function docExists(filePath: string): boolean {
  const fullPath = path.join(DOCS_DIRECTORY, filePath);
  return fs.existsSync(fullPath);
}

