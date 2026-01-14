import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

import {
  SearchSection,
  BusinessGrid,
  AddBusinessCTA,
} from "@/components/Nexaloc";

export default function NexalocPlatform() {
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [filterLocal, setFilterLocal] = useState("");
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Load businesses
  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBusinesses(data || []);
      } catch (err) {
        console.error("Error loading businesses:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBusinesses();
  }, []);

  // Filter businesses by search + filters
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const q = filterLocal.trim().toLowerCase();

      const matchesSearch =
        !q ||
        [b.name, b.village, b.category, b.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesCategory =
        !categoryFilter || b.category === categoryFilter;

      const matchesLocation =
        !locationFilter || b.village === locationFilter;

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [businesses, filterLocal, categoryFilter, locationFilter]);


  return (
    <div
      className="
        min-h-screen 
        bg-slate-50 dark:bg-slate-950
        text-slate-800 dark:text-slate-200
        transition-colors
      "
    >

      {/* Ambient gradient background */}
      <div
        className="
          pointer-events-none fixed inset-0 -z-10 opacity-70
          bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.05),transparent_60%),radial-gradient(circle_at_bottom,_rgba(0,0,0,0.04),transparent_60%)]
          dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),transparent_55%)]
        "
      />

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-10">

        {/* Search + Filters */}
        <SearchSection
          value={filterLocal}
          onChange={setFilterLocal}
          totalCount={businesses.length}
          filteredCount={filteredBusinesses.length}
          categories={Array.from(new Set(businesses.map(b => b.category).filter(Boolean)))}
          locations={Array.from(new Set(businesses.map(b => b.village).filter(Boolean)))}
          selectedCategory={categoryFilter}
          selectedLocation={locationFilter}
          onCategoryChange={setCategoryFilter}
          onLocationChange={setLocationFilter}
          onClearFilters={() => {
            setFilterLocal("");
            setCategoryFilter("");
            setLocationFilter("");
          }}
        />

        {/* Business List */}
        <BusinessGrid
          businesses={filteredBusinesses}
          loading={loading}
          onBusinessClick={(id) => navigate(`/business/${id}`)}
        />

        {/* CTA */}
        <AddBusinessCTA onClick={() => navigate("/join")} />

      </div>
    </div>
  );
}
