// src/hooks/useBusinessesManager.js
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useBusinessesManager() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    category: "",
    village: "",
    owner: "",
  });

  // Search
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Load businesses
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setBusinesses(data || []);
      setLoading(false);
    }
    load();
  }, []);

  // Unique values (memoized)
  const categories = useMemo(
    () =>
      [...new Set(businesses.map((b) => b.category).filter(Boolean))].sort(),
    [businesses]
  );

  const villages = useMemo(
    () =>
      [...new Set(businesses.map((b) => b.village).filter(Boolean))].sort(),
    [businesses]
  );

  // Filtering (memoized)
  const filtered = useMemo(() => {
    let result = businesses;

    result = result.filter((b) => {
      const matchCategory = !filters.category || b.category === filters.category;
      const matchVillage = !filters.village || b.village === filters.village;
      const matchOwner =
        !filters.owner ||
        (b.owner &&
          b.owner.toLowerCase().includes(filters.owner.toLowerCase()));

      return matchCategory && matchVillage && matchOwner;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        [b.name, b.owner, b.category, b.village].some((field) =>
          field?.toLowerCase().includes(q)
        )
      );
    }

    return result;
  }, [businesses, filters, search]);

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search]);

  // Pagination (memoized)
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)),
    [filtered, ITEMS_PER_PAGE]
  );

  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filtered, currentPage, ITEMS_PER_PAGE]
  );

  // Ensure currentPage not beyond totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Selections
  const allSelected =
    paginated.length > 0 && paginated.every((b) => selectedIds.includes(b.id));

  const toggleSelectOne = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginated.some((b) => b.id === id))
      );
    } else {
      setSelectedIds((prev) => {
        const set = new Set(prev);
        paginated.forEach((b) => set.add(b.id));
        return Array.from(set);
      });
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // CSV export of current filtered dataset
  const handleExportCSV = () => {
    if (!filtered.length) return;

    const headers = [
      "id",
      "name",
      "category",
      "village",
      "owner",
      "created_at",
    ];

    const rows = filtered.map((b) => [
      b.id,
      b.name,
      b.category,
      b.village,
      b.owner,
      b.created_at,
    ]);

    const escapeCell = (value) =>
      `"${(value ?? "").toString().replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => row.map(escapeCell).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "businesses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  return {
    businesses,
    setBusinesses,
    filtered,
    paginated,
    loading,

    // filters
    filters,
    setFilters,
    handleChangeFilters: (partial) =>
      setFilters((prev) => ({ ...prev, ...partial })),
    resetFilters: () => setFilters({ category: "", village: "", owner: "" }),

    // search
    search,
    setSearch,

    // pagination
    currentPage,
    setCurrentPage,
    totalPages,
    onPageChange,

    // selection
    selectedIds,
    toggleSelectOne,
    toggleSelectAll,
    clearSelection,
    allSelected,

    // unique values
    categories,
    villages,

    // export
    handleExportCSV,
  };
}
