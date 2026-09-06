import Link from 'next/link';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        This route is not part of the static Vitals.AI export.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
      >
        Back to home
      </Link>
    </div>
  );
}
