"use client";

import { useParams, useRouter } from "next/navigation";
import { useAccount } from "@stayflow/auth";
import { useT } from "@stayflow/i18n";
import { GuideEditor } from "@stayflow/module-guest";

export default function GuidePage() {
  const t = useT();
  const router = useRouter();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { client, org, allProperties } = useAccount();
  const property = allProperties.find((p) => p.id === propertyId && !p.parentId);
  if (!property) return <p className="text-sm text-muted">{t("guest.notFound")}</p>;
  return (
    <GuideEditor
      client={client}
      property={property}
      publicBaseUrl={process.env.NEXT_PUBLIC_GUEST_PUBLIC_URL ?? ""}
      onBack={() => router.push("/")}
      starter={org?.lodgingType === "hotel" || org?.lodgingType === "hostel" ? org.lodgingType : undefined}
    />
  );
}
