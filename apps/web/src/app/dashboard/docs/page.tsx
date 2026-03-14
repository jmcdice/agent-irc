import Link from 'next/link';
import { docsConfig, getFirstDocSlug } from '@/content/docs/_config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function DocsPage() {
  const [firstChapter, firstSection] = getFirstDocSlug();
  
  return (
    <div className="container mx-auto py-8 px-6 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <BookOpenIcon className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          App Shell Documentation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          A comprehensive guide to building production-ready full-stack applications
          with App Shell. Learn about architecture, features, and best practices.
        </p>
        <Button asChild size="lg">
          <Link href={`/dashboard/docs/${firstChapter}/${firstSection}`}>
            Get Started
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Chapter Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {docsConfig.map((chapter) => {
          const firstSectionSlug = chapter.sections[0]?.slug;
          return (
            <Card key={chapter.slug} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  <Link
                    href={`/dashboard/docs/${chapter.slug}/${firstSectionSlug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {chapter.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {chapter.sections.length} section{chapter.sections.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {chapter.sections.slice(0, 3).map((section) => (
                    <li key={section.slug}>
                      <Link
                        href={`/dashboard/docs/${chapter.slug}/${section.slug}`}
                        className="hover:text-foreground transition-colors"
                      >
                        • {section.title}
                      </Link>
                    </li>
                  ))}
                  {chapter.sections.length > 3 && (
                    <li className="text-xs">
                      +{chapter.sections.length - 3} more...
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Looking for something specific? Expand &quot;Documentation&quot; in the sidebar or browse by chapter above.
        </p>
      </div>
    </div>
  );
}

