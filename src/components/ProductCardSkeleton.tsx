export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
      <div className="p-3 pb-0">
        <div className="aspect-[2.5/3.5] bg-slate-100 rounded-xl" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-slate-100 rounded-full w-16" />
          <div className="h-5 bg-slate-100 rounded-full w-12" />
        </div>
        <div className="pt-3 border-t border-slate-50">
          <div className="h-6 bg-slate-100 rounded w-20 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="h-9 bg-slate-100 rounded-xl w-20" />
        <div className="h-9 bg-slate-100 rounded-xl flex-1" />
      </div>
    </div>
  );
}
