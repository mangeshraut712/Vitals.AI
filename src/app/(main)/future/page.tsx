import FutureDashboard from '@/components/future/FutureDashboard';
import { DataErrorBoundary } from '@/components/ErrorBoundary';

export default function FuturePage(): React.JSX.Element {
  return (
    <DataErrorBoundary>
      <FutureDashboard />
    </DataErrorBoundary>
  );
}
