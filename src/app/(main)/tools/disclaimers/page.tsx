import {
  AlertTriangle,
  Bot,
  FileCheck2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';

const items = [
  {
    title: 'Not Medical Advice',
    description:
      'Vitals.AI is an informational product, not a diagnostic or treatment service. Always verify decisions with licensed healthcare professionals.',
    icon: AlertTriangle,
  },
  {
    title: 'AI Output Limits',
    description:
      'AI responses can be incomplete or incorrect. Treat generated guidance as support for thinking, not as clinical authority.',
    icon: Bot,
  },
  {
    title: 'Data Privacy',
    description:
      'Your files stay under your control. External calls happen only to providers you configure via your own API keys.',
    icon: Lock,
  },
  {
    title: 'Extraction Accuracy',
    description:
      'PDF and file parsing may miss or misread uncommon formats. Validate extracted values against original reports.',
    icon: FileCheck2,
  },
];

export default function DisclaimersPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <PageHero
        eyebrow="Safety"
        title="Disclaimers"
        description="Vitals.AI is built for clarity and privacy-first analysis, but it is not a replacement for professional medical care. Review these guardrails before acting on insights."
        icon={ShieldCheck}
        actions={[{ label: 'Open Guides', href: '/tools/guides' }]}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => {
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

