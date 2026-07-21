export default function BlogPostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-slate-200" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
