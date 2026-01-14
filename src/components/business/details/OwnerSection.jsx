// src/components/business/details/OwnerSection.jsx
import OwnerTools from "@/components/business/owner/OwnerTools/OwnerTools";

export default function OwnerSection({ business, isOwner, navigate }) {
  return (
    <section className="mt-6">
      <OwnerTools isOwner={isOwner} business={business} navigate={navigate} />
    </section>
  );
}
