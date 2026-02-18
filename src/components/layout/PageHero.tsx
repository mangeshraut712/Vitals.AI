import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface HeroAction {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary';
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: HeroAction[];
}

export function PageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions = [],
}: PageHeroProps): React.JSX.Element {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-8 md:px-8 md:py-10 shadow-sm">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <Icon className="h-5 w-5" />
              </span>
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            {actions.map((action) => {
              const ActionIcon = action.icon ?? ArrowRight;
              const isPrimary = action.variant !== 'secondary';

              return (
                <Link
                  key={`${action.href}:${action.label}`}
                  href={action.href}
                  className={
                    isPrimary
                      ? 'inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90'
                      : 'inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent'
                  }
                >
                  <span>{action.label}</span>
                  <ActionIcon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </header>
  );
}

