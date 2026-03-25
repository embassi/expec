export default function Loading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-1" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse mt-2" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
