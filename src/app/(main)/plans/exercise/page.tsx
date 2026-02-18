import { Activity, BarChart3, Dumbbell, Flame } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';

const modules = [
  {
    title: 'Recovery-Aware Training',
    description:
      'Align intensity and volume with HRV, sleep quality, and daily recovery patterns.',
    icon: Activity,
  },
  {
    title: 'Progressive Strength Blocks',
    description:
      'Structured phases for hypertrophy, strength, and deload built around your body composition goals.',
    icon: Dumbbell,
  },
  {
    title: 'Conditioning Framework',
    description:
      'Balance zone 2, threshold, and sprint exposures for long-term metabolic and cardiovascular outcomes.',
    icon: Flame,
  },
];

export default function ExercisePage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <PageHero
        eyebrow="Plans"
        title="Exercise"
        description="An upgraded training planning surface is in progress. The new model will connect your recovery telemetry, biomarkers, and goals into weekly, adaptive training blocks."
        icon={BarChart3}
        actions={[
          { label: 'Open Lifestyle', href: '/lifestyle' },
          { label: 'Open Vitals Monitor', href: '/vitals', variant: 'secondary' },
        ]}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-5 w-5 text-foreground" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

