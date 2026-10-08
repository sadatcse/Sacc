import { cn } from '@/lib/utils';

export default function Container({ children, className }) {
  return <div className={cn('container max-w-7xl 2xl:max-w-screen-2xl', className)}>{children}</div>;
}
