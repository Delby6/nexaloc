import DistributionList from "@/components/operator/DistributionList";
import { useBusinessesManager } from "@/hooks/useBusinessesManager";

export default function OperatorNetwork() {
  const { filtered } = useBusinessesManager();

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Network Overview</h1>
      <DistributionList businesses={filtered} />
    </div>
  );
}
