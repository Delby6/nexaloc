import { useMemo, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import AssignModal from "./AssignModal";

export default function BulkTable({
  businesses,        // paginated list for current page
  fullBusinesses,    // all filtered businesses (for summary + dropdowns)
  selectedIds,
  allSelected,
  onToggleOne,
  onToggleAll,
  onBulkDelete,
  onBulkAssignCategory,
  onBulkAssignVillage,
}) {
  const hasSelection = selectedIds.length > 0;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignCategoryOpen, setAssignCategoryOpen] = useState(false);
  const [assignVillageOpen, setAssignVillageOpen] = useState(false);

  // Selected businesses & names for summary (from full filtered list)
  const selectedBusinesses = useMemo(
    () => fullBusinesses.filter((b) => selectedIds.includes(b.id)),
    [fullBusinesses, selectedIds]
  );

  const selectedNames = useMemo(
    () => selectedBusinesses.map((b) => b.name || `#${b.id}`),
    [selectedBusinesses]
  );

  // Unique categories & villages (for dropdowns) – from full filtered list
  const categories = useMemo(
    () =>
      [...new Set(fullBusinesses.map((b) => b.category).filter(Boolean))].sort(),
    [fullBusinesses]
  );

  const villages = useMemo(
    () =>
      [...new Set(fullBusinesses.map((b) => b.village).filter(Boolean))].sort(),
    [fullBusinesses]
  );

  return (
    <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-950/5 dark:shadow-slate-950/40">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Manage Businesses
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {businesses.length} businesses on this page
        </span>
      </div>

      {/* Bulk Action Bar */}
      {hasSelection && (
        <div className="mb-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-200 text-sm">
            {selectedIds.length} selected
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAssignCategoryOpen(true)}
              className="px-3 py-1 text-xs font-medium rounded bg-sky-600 hover:bg-sky-700 text-white"
            >
              Assign Category
            </button>
            <button
              onClick={() => setAssignVillageOpen(true)}
              className="px-3 py-1 text-xs font-medium rounded bg-purple-600 hover:bg-purple-700 text-white"
            >
              Assign Village
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-3 py-1 text-xs font-medium rounded bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80">
            <tr>
              <th className="px-3 py-2 text-left w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                />
              </th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Village</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>

          <tbody>
            {businesses.map((b) => (
              <tr
                key={b.id}
                className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(b.id)}
                    onChange={() => onToggleOne(b.id)}
                  />
                </td>
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                  {b.name}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {b.category}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {b.village}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {b.owner}
                </td>
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                  {b.created_at?.slice(0, 10)}
                </td>
              </tr>
            ))}

            {!businesses.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-slate-500 dark:text-slate-400"
                >
                  No businesses match current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======= MODALS ======= */}

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete selected businesses?"
        message="This will permanently remove all selected businesses. This cannot be undone."
        confirmText="Delete"
        confirmColor="bg-rose-600 hover:bg-rose-700"
        onConfirm={onBulkDelete}
        summaryItems={selectedNames}
      />

      <AssignModal
        open={assignCategoryOpen}
        onClose={() => setAssignCategoryOpen(false)}
        title="Assign Category"
        label="Category"
        submitText="Assign"
        options={categories}
        onSubmit={onBulkAssignCategory}
        summaryItems={selectedNames}
      />

      <AssignModal
        open={assignVillageOpen}
        onClose={() => setAssignVillageOpen(false)}
        title="Assign Village"
        label="Village"
        submitText="Assign"
        options={villages}
        onSubmit={onBulkAssignVillage}
        summaryItems={selectedNames}
      />
    </section>
  );
}
