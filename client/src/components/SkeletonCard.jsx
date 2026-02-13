export default function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
      <div className="skeleton h-4 w-48" />
      <div className="skeleton h-4 w-36" />
      <div className="flex gap-2 mt-2">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}
