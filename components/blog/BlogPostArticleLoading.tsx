export function BlogPostArticleLoading() {
  return (
    <article className="retro-content" aria-busy="true">
      <header>
        <div className="h-4 w-40 max-w-[50%] rounded bg-muted motion-safe:animate-pulse" />
      </header>

      <div className="my-6 border-b border-border" role="presentation" />

      <section className="article-main space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="h-8 w-[min(100%,28rem)] rounded-md bg-muted motion-safe:animate-pulse" />
        <div className="space-y-2 pt-2">
          <div className="h-3 w-full rounded bg-muted/80 motion-safe:animate-pulse" />
          <div className="h-3 w-[95%] rounded bg-muted/80 motion-safe:animate-pulse" />
          <div className="h-3 w-[88%] rounded bg-muted/80 motion-safe:animate-pulse" />
          <div className="h-3 w-[92%] rounded bg-muted/80 motion-safe:animate-pulse" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-3 w-full rounded bg-muted/60 motion-safe:animate-pulse" />
          <div className="h-3 w-[90%] rounded bg-muted/60 motion-safe:animate-pulse" />
          <div className="h-3 w-[70%] rounded bg-muted/60 motion-safe:animate-pulse" />
        </div>
      </section>
    </article>
  );
}
