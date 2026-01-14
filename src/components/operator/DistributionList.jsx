// src/components/operator/DistributionList.jsx
export default function DistributionList({ businesses }) {
  if (!businesses?.length)
    return (
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        No business data available.
      </p>
    );

  const byCategory = {};
  const byVillage = {};

  businesses.forEach((b) => {
    byCategory[b.category] = (byCategory[b.category] || 0) + 1;
    byVillage[b.village] = (byVillage[b.village] || 0) + 1;
  });

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <div>
        <h3 className="text-slate-900 dark:text-slate-300 font-medium mb-2">
          By Category
        </h3>
        <ul className="space-y-1 text-sm">
          {Object.entries(byCategory).map(([cat, count]) => (
            <li key={cat} className="flex justify-between">
              <span>{cat}</span>
              <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-slate-900 dark:text-slate-300 font-medium mb-2">
          By Village
        </h3>
        <ul className="space-y-1 text-sm">
          {Object.entries(byVillage).map(([v, count]) => (
            <li key={v} className="flex justify-between">
              <span>{v}</span>
              <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
