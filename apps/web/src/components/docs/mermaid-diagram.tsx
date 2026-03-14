'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const renderDiagram = async () => {
      try {
        // Dynamically import mermaid to avoid SSR issues
        const mermaid = (await import('mermaid')).default;

        // Configure mermaid based on theme
        const isDark = resolvedTheme === 'dark';

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          themeVariables: isDark
            ? {
                // Dark mode colors
                primaryColor: '#3b82f6',
                primaryTextColor: '#f8fafc',
                primaryBorderColor: '#60a5fa',
                lineColor: '#94a3b8',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
                background: '#0d1117',
                mainBkg: '#1e293b',
                nodeBorder: '#3b82f6',
                clusterBkg: '#1e293b',
                clusterBorder: '#475569',
                titleColor: '#f1f5f9',
                edgeLabelBackground: '#1e293b',
              }
            : {
                // Light mode colors
                primaryColor: '#3b82f6',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#2563eb',
                lineColor: '#64748b',
                secondaryColor: '#f1f5f9',
                tertiaryColor: '#e2e8f0',
                background: '#ffffff',
                mainBkg: '#f8fafc',
                nodeBorder: '#3b82f6',
                clusterBkg: '#f8fafc',
                clusterBorder: '#cbd5e1',
                titleColor: '#1e293b',
                edgeLabelBackground: '#f8fafc',
              },
        });

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart, resolvedTheme, mounted]);

  // Show nothing during SSR
  if (!mounted) {
    return (
      <div className="my-3 p-4 rounded-md bg-muted/50 text-center text-muted-foreground text-sm">
        Loading diagram...
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-3 p-4 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-600 dark:text-red-400 font-mono">
          Mermaid Error: {error}
        </p>
        <pre className="mt-2 text-xs text-muted-foreground overflow-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-3 p-4 rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] overflow-auto flex justify-center [&>svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

