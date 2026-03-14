import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { getAllDocSlugs, findDocBySlug } from '@/content/docs/_config';
import { getDocContent, parseMarkdown } from '@/lib/docs';
import { MarkdownRenderer } from '@/components/docs/markdown-renderer';
import { ChapterTabs } from '@/components/docs/chapter-tabs';
import { Button } from '@/components/ui/button';

interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const doc = findDocBySlug(resolvedParams.slug);
  
  if (!doc) {
    return { title: 'Documentation - App Shell' };
  }

  return {
    title: `${doc.section.title} - ${doc.chapter.title} | App Shell Docs`,
    description: `Learn about ${doc.section.title} in the App Shell documentation.`,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const resolvedParams = await params;
  const doc = findDocBySlug(resolvedParams.slug);

  if (!doc) {
    notFound();
  }

  const content = getDocContent(doc.section.file);
  const { title } = parseMarkdown(content);

  return (
    <div className="flex flex-col">
      {/* Chapter Header & Tabs */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground pt-4 pb-2">
            <Link href="/dashboard/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{doc.chapter.title}</span>
          </nav>
          {/* Chapter Section Tabs */}
          <ChapterTabs chapter={doc.chapter} className="border-b-0 -mb-px" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <MarkdownRenderer content={content} />
        </article>

        {/* Previous / Next Navigation */}
        <nav className="flex items-center justify-between mt-12 pt-6 border-t">
          {doc.prevDoc ? (
            <Button variant="ghost" asChild className="gap-2">
              <Link href={`/dashboard/docs/${doc.prevDoc.chapter}/${doc.prevDoc.section}`}>
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Previous:</span>
                <span>{doc.prevDoc.title}</span>
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {doc.nextDoc ? (
            <Button variant="ghost" asChild className="gap-2">
              <Link href={`/dashboard/docs/${doc.nextDoc.chapter}/${doc.nextDoc.section}`}>
                <span className="hidden sm:inline">Next:</span>
                <span>{doc.nextDoc.title}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </div>
  );
}

