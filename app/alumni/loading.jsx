import { DirectorySkeleton } from '@/components/loading/PageSkeletons';

// Shown instantly while the page reads MongoDB
export default function Loading() {
  return <DirectorySkeleton />;
}
