import { CardGridSkeleton } from '@/components/loading/PageSkeletons';

// Shown instantly while the page reads MongoDB
export default function Loading() {
  return <CardGridSkeleton label="Loading photos…" chips={false} count={9} />;
}
