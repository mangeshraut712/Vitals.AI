import { Dumbbell } from 'lucide-react';

export default function ExercisePage(): React.JSX.Element {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Exercise Plan</h1>
        <p className="text-gray-500 mt-1">Personalized workout recommendations</p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          AI-powered exercise recommendations tailored to your fitness level, body composition, and health goals.
        </p>
      </div>
    </div>
  );
}
