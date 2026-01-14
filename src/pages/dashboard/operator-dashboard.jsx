import DashboardHeader from "@/components/layout/DashboardHeader";

// Icons
import { Database, Grid, MapPin, Activity } from "lucide-react";

// Operator Components
import OperatorAnalytics from "@/components/operator/OperatorAnalytics";
import DistributionList from "@/components/operator/DistributionList";
import MetricCard from "@/components/operator/MetricCard";

// System Health Suite
import SystemHealthCards from "@/components/operator/SystemHealthCards";
import SystemHealthSparkline from "@/components/operator/SystemHealthSparkline";
import SystemServiceTable from "@/components/operator/SystemServiceTable";
import SystemErrorFeed from "@/components/operator/SystemErrorFeed";
import SystemAIInsights from "@/components/operator/SystemAIInsights";
import SystemAlerts from "@/components/operator/SystemAlerts";
import SystemActions from "@/components/operator/SystemActions";

// Filters, Tables, Pagination
import FiltersPanel from "@/components/operator/FiltersPanel";
import GlobalSearch from "@/components/operator/GlobalSearch";
import BulkTable from "@/components/operator/BulkTable";
import Pagination from "@/components/operator/Pagination";

// Hooks
import { useBusinessesManager } from "@/hooks/useBusinessesManager";
import useHealthMonitor from "@/hooks/useHealthMonitor";
import { useDashboardData } from "@/hooks/useDashboardData";


export default function OperatorDashboard() {
  const {
    businesses,
    loading,
    systemStatus,
    totalBusinesses,
    categoriesCount,
    villagesCount,
  } = useDashboardData();

  // For analytics and distribution we just pass ALL businesses
  const filteredBusinesses = businesses || [];

  return (
    <div className="space-y-10">

      <DashboardHeader
        title="Operator Dashboard"
        subtitle="System overview and high-level analytics"
      />

      {/* METRIC CARDS */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Database className="w-5 h-5 text-sky-500" />}
          label="Total Businesses"
          value={loading ? "…" : totalBusinesses}
        />

        <MetricCard
          icon={<Grid className="w-5 h-5 text-purple-500" />}
          label="Categories"
          value={loading ? "…" : categoriesCount}
        />

        <MetricCard
          icon={<MapPin className="w-5 h-5 text-emerald-500" />}
          label="Villages"
          value={loading ? "…" : villagesCount}
        />

        <MetricCard
          icon={<Activity className="w-5 h-5 text-rose-500" />}
          label="System Status"
          value={systemStatus === "online" ? "Operational" : "Offline"}
          highlight={systemStatus !== "online"}
        />
      </section>

      {/* ANALYTICS */}
      <OperatorAnalytics businesses={filteredBusinesses} />

      {/* DISTRIBUTION */}
      <section className="bg-white dark:bg-slate-900/60 border rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Business Distribution</h2>
        <DistributionList businesses={filteredBusinesses} />
      </section>

    </div>
  );
}
