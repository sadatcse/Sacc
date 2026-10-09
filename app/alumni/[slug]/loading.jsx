import { ProfileSkeleton } from '@/components/loading/PageSkeletons';

// Shown instantly while the page reads MongoDB
export default function Loading() {
  return <ProfileSkeleton label="Loading alumni profile…" />;
}
