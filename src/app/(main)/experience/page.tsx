import Link from 'next/link';
import {
  Activity,
  Brain,
  ChartColumnBig,
  HeartPulse,
  Layers3,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';

const pillars = [
  {
    title: 'Unified Health Signal',
    description:
      'Biomarkers, body composition, recovery, and events merged into one clean intelligence layer.',
    icon: Layers3,
    href: '/dashboard',
  },
  {
    title: 'Precision Biomarker Insights',
    description:
      'Reference-aware interpretation with trend context to help prioritize what matters now.',
    icon: ChartColumnBig,
    href: '/biomarkers',
  },
  {
    title: 'AI Health Copilot',
    description:
      'Ask direct questions and get context-aware answers grounded in your synced health profile.',
    icon: Brain,
    href: '/tools/agent',
  },
];

const journeys = [
  {
    title: 'Longevity',
    subtitle: 'Biological age and long-term risk trend tracking',
    icon: TimerReset,
    href: '/goals',
  },
  {
    title: 'Performance',
    subtitle: 'Recovery, HRV, strain, and training-readiness workflows',
    icon: Activity,
    href: '/lifestyle',
  },
  {
    title: 'Body Composition',
    subtitle: 'DEXA-driven body fat, lean mass, visceral fat, and ALMI views',
    icon: HeartPulse,
    href: '/body-comp',
  },
];

export default function ExperiencePage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 lg:px-8">
      <PageHero
        eyebrow="OpenHealth Design"
        title="A Health Operating System, Refined"
        description="The new Vitals.AI experience brings an Apple-like visual language to clinical-grade health intelligence: quieter UI, stronger hierarchy, faster actions, and clearer decisions."
        icon={Sparkles}
        actions={[
          { label: 'Open Dashboard', href: '/dashboard' },
          { label: 'Try The Agent', href: '/tools/agent', variant: 'secondary' },
        ]}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
              <p className="mt-4 text-sm font-medium text-primary transition group-hover:translate-x-0.5">
                Explore →
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Choose Your Journey</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Start where you care most today. Every journey connects to the same health graph,
          so improvements in one area become visible across the whole product.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {journeys.map((journey) => {
            const Icon = journey.icon;
            return (
              <Link
                key={journey.title}
                href={journey.href}
                className="rounded-2xl border border-border/80 bg-background p-5 transition hover:border-primary/30 hover:bg-accent/40"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">{journey.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{journey.subtitle}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

