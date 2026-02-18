import { Apple, Beaker, Salad, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';

const modules = [
  {
    title: 'Biomarker-Driven Nutrition',
    description:
      'Translate glucose, lipids, CRP, and micronutrient signals into practical food decisions.',
    icon: Beaker,
  },
  {
    title: 'Supplement Prioritization',
    description:
      'Rank supplements by expected impact and urgency, based on your current profile.',
    icon: Sparkles,
  },
  {
    title: 'Weekly Meal Rhythm',
    description:
      'A repeatable structure for energy stability, recovery, and metabolic consistency.',
    icon: Salad,
  },
];

export default function DietPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <PageHero
        eyebrow="Plans"
        title="Diet & Supplements"
        description="A calmer, evidence-aware nutrition planning surface. This page is being upgraded into a full biomarker-linked planner with meal and supplement workflows."
        icon={Apple}
        actions={[
          { label: 'View Biomarkers', href: '/biomarkers' },
          { label: 'Open Goals', href: '/goals', variant: 'secondary' },
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

