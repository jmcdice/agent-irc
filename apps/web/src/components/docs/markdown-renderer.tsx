'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MermaidDiagram } from './mermaid-diagram';
import {
  InformationCircleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// Callout type configuration with icons and colors
const calloutConfig = {
  NOTE: {
    icon: InformationCircleIcon,
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-500',
  },
  TIP: {
    icon: LightBulbIcon,
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    iconColor: 'text-green-500',
  },
  WARNING: {
    icon: ExclamationTriangleIcon,
    borderColor: 'border-l-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    iconColor: 'text-yellow-500',
  },
  IMPORTANT: {
    icon: ExclamationCircleIcon,
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    iconColor: 'text-red-500',
  },
} as const;

type CalloutType = keyof typeof calloutConfig;

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Strip HTML comments from markdown content.
 * This removes AI_CONTEXT blocks and other HTML comments.
 */
function stripHtmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '').trim();
}

/**
 * Check if a value is a React element with props
 */
function isReactElement(value: unknown): value is React.ReactElement<{ children?: React.ReactNode; className?: string }> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'props' in value &&
    typeof (value as { props: unknown }).props === 'object'
  );
}

/**
 * Extract text content from React children (for callout detection)
 */
function extractTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map(extractTextContent).join('');
  }
  if (isReactElement(children)) {
    return extractTextContent(children.props.children);
  }
  return '';
}

/**
 * Remove callout prefix from children while preserving structure
 */
function removeCalloutPrefix(children: React.ReactNode, prefix: string): React.ReactNode {
  if (!children) return children;

  // Handle array of children
  if (Array.isArray(children)) {
    let prefixRemoved = false;
    return children.map((child, index) => {
      if (prefixRemoved) return child;
      const result = removeCalloutPrefix(child, prefix);
      if (result !== child) prefixRemoved = true;
      return <span key={index}>{result}</span>;
    });
  }

  // Handle React elements (like <p> tags)
  if (isReactElement(children)) {
    const newChildren = removeCalloutPrefix(children.props.children, prefix);
    // Return just the children without the wrapper element for the first paragraph
    return newChildren;
  }

  // Handle strings
  if (typeof children === 'string') {
    if (children.startsWith(prefix.trim())) {
      return children.slice(prefix.trim().length).trimStart();
    }
    // Also handle the case where the prefix pattern is at the start
    const calloutPattern = /^\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i;
    return children.replace(calloutPattern, '');
  }

  return children;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const processedContent = stripHtmlComments(content);

  return (
    <div
      className={cn(
        // docs-content class enables syntax highlighting from globals.css
        'docs-content',
        // Base prose styling - using prose-sm for tighter GitHub README feel
        'prose prose-sm dark:prose-invert max-w-none',
        // Tighter spacing like GitHub README
        'prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2',
        'prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-1',
        'prose-h3:text-lg prose-h4:text-base',
        'prose-p:text-foreground prose-p:leading-6 prose-p:my-2',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-foreground prose-strong:font-semibold',
        // Inline code styling
        'prose-code:text-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-xs prose-code:before:content-none prose-code:after:content-none',
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:my-2',
        'prose-hr:border-border prose-hr:my-4',
        'prose-li:text-foreground prose-li:my-0.5',
        'prose-ul:my-2 prose-ol:my-2',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          // Links - handle internal vs external with Next.js Link
          a: ({ href, children }) => {
            const isInternal = href?.startsWith('/') || href?.startsWith('#');
            if (isInternal && href) {
              return <Link href={href}>{children}</Link>;
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },

          // Blockquotes - detect callouts (NOTE, TIP, WARNING, IMPORTANT) or render as regular quote
          blockquote: ({ children }) => {
            // Extract text content to detect callout type
            const textContent = extractTextContent(children);
            const calloutMatch = textContent.match(/^\s*\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i);

            if (calloutMatch) {
              const type = calloutMatch[1].toUpperCase() as CalloutType;
              const config = calloutConfig[type];
              const Icon = config.icon;

              return (
                <div className={cn('my-3 border-l-4 rounded-r-md not-prose flex gap-3 p-3', config.borderColor, config.bgColor)}>
                  <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
                  <div className="text-sm leading-relaxed [&>p]:m-0 [&>p:first-child]:inline">
                    {removeCalloutPrefix(children, calloutMatch[0])}
                  </div>
                </div>
              );
            }

            // Regular blockquote
            return (
              <Card className="my-3 border-l-4 border-l-primary not-prose">
                <CardContent className="py-2 px-4 text-muted-foreground [&>p]:m-0 [&>p]:text-sm [&>p]:leading-relaxed">
                  {children}
                </CardContent>
              </Card>
            );
          },

          // Code blocks - detect mermaid or render with light/dark adaptive styling
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            // Handle mermaid diagrams
            if (language === 'mermaid') {
              const chart = String(children).replace(/\n$/, '');
              return <MermaidDiagram chart={chart} />;
            }

            // Regular inline or block code (block code is inside <pre>)
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },

          // Wrapper for code blocks - light/dark adaptive styling
          pre: ({ children }) => {
            // Check if this pre contains a mermaid diagram (which renders its own container)
            if (isReactElement(children) && children.props.className?.includes('language-mermaid')) {
              // Don't wrap mermaid diagrams in the pre card
              return <>{children}</>;
            }

            return (
              <Card className="my-3 p-0 overflow-hidden not-prose border-0 rounded-md">
                <pre className="overflow-x-auto bg-[#f6f8fa] dark:bg-[#0d1117] p-3 m-0 text-sm font-mono">
                  {children}
                </pre>
              </Card>
            );
          },

          // Tables - using shadcn/ui Table components in Card
          table: ({ children }) => (
            <Card className="my-3 overflow-hidden not-prose">
              <Table>{children}</Table>
            </Card>
          ),
          thead: ({ children }) => <TableHeader>{children}</TableHeader>,
          tbody: ({ children }) => <TableBody>{children}</TableBody>,
          tr: ({ children }) => <TableRow>{children}</TableRow>,
          th: ({ children }) => <TableHead>{children}</TableHead>,
          td: ({ children }) => <TableCell>{children}</TableCell>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

