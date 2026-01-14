// src/pages/businesses/OperatorBusinesses.jsx
import { useEffect, useState } from "react";
import FiltersPanel from "@/components/operator/FiltersPanel";
import GlobalSearch from "@/components/operator/GlobalSearch";
import Pagination from "@/components/operator/Pagination";
import BulkTable from "@/components/operator/BulkTable";
import { useBusinessesManager } from "@/hooks/useBusinessesManager";
import { supabase } from "@/lib/supabaseClient";

export default function OperatorBusinesses() {
  const {
    businesses,
    setBusinesses,
    filtered,
    paginated,
    filters,
    search,
    categories,
    villages,
    selectedIds,
    allSelected,
    totalPages,
    currentPage,
    handleChangeFilters,
    resetFilters,
    handleExportCSV,
    setSearch,
    toggleSelectOne,
    toggleSelectAll,
    onPageChange,
    clearSelection,
  } = useBusinessesManager();

  // Toast + undo state
  const [toast, setToast] = useState(null); // { message, variant, withUndo }
  const [undoState, setUndoState] = useState(null); // { type, items }

  const showToast = ({ message, variant = "info", withUndo = false }) => {
    setToast({
      id: Date.now(),
      message,
      variant,
      withUndo,
    });
  };

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleUndo = async () => {
    if (!undoState) return;
    const action = undoState;
    setUndoState(null);

    if (action.type === "delete") {
      const { error } = await supabase
        .from("businesses")
        .insert(action.items);

      if (!error) {
        setBusinesses((prev) => [...action.items, ...prev]);
        showToast({
          message: "Delete undone.",
          variant: "success",
        });
      } else {
        showToast({
          message: "Failed to undo delete.",
          variant: "error",
        });
      }
    } else if (action.type === "assign-category") {
      const { error } = await supabase
        .from("businesses")
        .upsert(
          action.items.map(({ id, category }) => ({
            id,
            category,
          }))
        );

      if (!error) {
        setBusinesses((prev) =>
          prev.map((b) => {
            const prevItem = action.items.find((p) => p.id === b.id);
            return prevItem ? { ...b, category: prevItem.category } : b;
          })
        );
        showToast({
          message: "Category assignment undone.",
          variant: "success",
        });
      } else {
        showToast({
          message: "Failed to undo category assignment.",
          variant: "error",
        });
      }
    } else if (action.type === "assign-village") {
      const { error } = await supabase
        .from("businesses")
        .upsert(
          action.items.map(({ id, village }) => ({
            id,
            village,
          }))
        );

      if (!error) {
        setBusinesses((prev) =>
          prev.map((b) => {
            const prevItem = action.items.find((p) => p.id === b.id);
            return prevItem ? { ...b, village: prevItem.village } : b;
          })
        );
        showToast({
          message: "Village assignment undone.",
          variant: "success",
        });
      } else {
        showToast({
          message: "Failed to undo village assignment.",
          variant: "error",
        });
      }
    }
  };

  // === BULK ACTIONS ===

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;

    const affected = businesses.filter((b) => ids.includes(b.id));
    if (!affected.length) return;

    const previous = businesses;

    // Optimistic UI
    setBusinesses((prev) => prev.filter((b) => !ids.includes(b.id)));
    clearSelection();

    setUndoState({
      type: "delete",
      items: affected,
    });

    showToast({
      message: `${affected.length} businesses deleted.`,
      variant: "info",
      withUndo: true,
    });

    const { error } = await supabase
      .from("businesses")
      .delete()
      .in("id", ids);

    if (error) {
      // Roll back
      setBusinesses(previous);
      setUndoState(null);
      showToast({
        message: "Failed to delete businesses. Changes rolled back.",
        variant: "error",
      });
    }
  };

  const handleBulkAssignCategory = async (newCategory) => {
    const ids = [...selectedIds];
    if (!ids.length || !newCategory) return;

    const previous = businesses
      .filter((b) => ids.includes(b.id))
      .map((b) => ({ id: b.id, category: b.category || null }));

    // Optimistic UI
    const previousBusinesses = businesses;
    setBusinesses((prev) =>
      prev.map((b) =>
        ids.includes(b.id) ? { ...b, category: newCategory } : b
      )
    );
    clearSelection();

    setUndoState({
      type: "assign-category",
      items: previous,
    });

    showToast({
      message: `Category "${newCategory}" assigned to ${ids.length} businesses.`,
      variant: "success",
      withUndo: true,
    });

    const { error } = await supabase
      .from("businesses")
      .update({ category: newCategory })
      .in("id", ids);

    if (error) {
      // Roll back
      setBusinesses(previousBusinesses);
      setUndoState(null);
      showToast({
        message: "Failed to assign category. Changes rolled back.",
        variant: "error",
      });
    }
  };

  const handleBulkAssignVillage = async (newVillage) => {
    const ids = [...selectedIds];
    if (!ids.length || !newVillage) return;

    const previous = businesses
      .filter((b) => ids.includes(b.id))
      .map((b) => ({ id: b.id, village: b.village || null }));

    // Optimistic UI
    const previousBusinesses = businesses;
    setBusinesses((prev) =>
      prev.map((b) =>
        ids.includes(b.id) ? { ...b, village: newVillage } : b
      )
    );
    clearSelection();

    setUndoState({
      type: "assign-village",
      items: previous,
    });

    showToast({
      message: `Village "${newVillage}" assigned to ${ids.length} businesses.`,
      variant: "success",
      withUndo: true,
    });

    const { error } = await supabase
      .from("businesses")
      .update({ village: newVillage })
      .in("id", ids);

    if (error) {
      // Roll back
      setBusinesses(previousBusinesses);
      setUndoState(null);
      showToast({
        message: "Failed to assign village. Changes rolled back.",
        variant: "error",
      });
    }
  };

  return (
    <>
      <div className="space-y-10">
        <FiltersPanel
          filters={filters}
          categories={categories}
          villages={villages}
          onChangeFilters={handleChangeFilters}
          onReset={resetFilters}
          onExport={handleExportCSV}
        />

        <GlobalSearch search={search} onChange={setSearch} />

        <BulkTable
          businesses={paginated}
          fullBusinesses={filtered}
          selectedIds={selectedIds}
          allSelected={allSelected}
          onToggleOne={toggleSelectOne}
          onToggleAll={toggleSelectAll}
          onBulkDelete={handleBulkDelete}
          onBulkAssignCategory={handleBulkAssignCategory}
          onBulkAssignVillage={handleBulkAssignVillage}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm text-white",
              toast.variant === "error"
                ? "bg-rose-600"
                : toast.variant === "success"
                ? "bg-emerald-600"
                : "bg-slate-900",
            ].join(" ")}
          >
            <span>{toast.message}</span>

            {toast.withUndo && undoState && (
              <button
                onClick={handleUndo}
                className="ml-2 text-xs font-semibold underline underline-offset-2"
              >
                Undo
              </button>
            )}

            <button
              onClick={() => setToast(null)}
              className="ml-2 text-xs opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
