import { Utensils } from 'lucide-react';

export default function DietPage(): React.JSX.Element {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Diet & Supplements</h1>
        <p className="text-muted-foreground mt-1">Personalized nutrition recommendations</p>
      </header>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Utensils className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          AI-powered diet and supplement recommendations based on your biomarkers and health goals.
        </p>
      </div>
    </div>
  );
}
