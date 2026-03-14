export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

