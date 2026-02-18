import { BookOpen, FlaskConical, HeartPulse, Leaf, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';

const guides = [
  {
    title: 'Biomarker Deep Dive',
    description:
      'Understand LDL particles, ApoB, HbA1c, CRP, and how each marker contributes to metabolic and cardiovascular risk.',
    icon: FlaskConical,
  },
  {
    title: 'Recovery Blueprint',
    description:
      'Practical routines for better HRV, sleep consistency, and stress resilience without overengineering your day.',
    icon: HeartPulse,
  },
  {
    title: 'Nutrition & Lifestyle',
    description:
      'Use your health data to tune food quality, meal timing, movement, and supplement priorities.',
    icon: Leaf,
  },
];

export default function GuidesPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <PageHero
        eyebrow="Knowledge Base"
        title="Guides"
        description="Actionable playbooks for biomarker optimization, recovery, performance, and longevity. Every guide maps directly to pages and metrics inside Vitals.AI."
        icon={BookOpen}
        actions={[
          { label: 'Open Dashboard', href: '/dashboard' },
          { label: 'Ask The Agent', href: '/tools/agent', variant: 'secondary' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <article
              key={guide.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-5 w-5 text-foreground" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{guide.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {guide.description}
              </p>
              <p className="mt-5 text-sm font-medium text-primary">Guide pack in progress</p>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-cyan-500" />
        <p className="mt-3 text-sm text-muted-foreground">
          New guides are being shipped in phases. Use the Agent now for personalized, data-aware
          recommendations while the full library is being published.
        </p>
      </section>
    </div>
  );
}
