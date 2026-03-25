export default function Loading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="space-y-6 max-w-2xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-11 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
