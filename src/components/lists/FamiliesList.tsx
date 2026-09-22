"use client";

import { useFamilies } from "@/lib/data/hooks";
import { DirectoryList, type Column } from "../DirectoryList";
import type { Dictionary } from "@/i18n";
import type { Family } from "@/lib/schema";

export function FamiliesList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useFamilies();

  const columns: Column<Family>[] = [
    { key: "parentName", header: t.name, cell: (f) => <span dir="auto">{f.parentName}</span> },
    {
      key: "phone",
      header: t.phone,
      cell: (f) => <span dir="ltr">{f.phone ?? "—"}</span>,
    },
  ];

  return (
    <DirectoryList
      t={t}
      title={t.families}
      columns={columns}
      rows={data}
      isLoading={isLoading}
      searchText={(f) => f.parentName}
    />
  );
}
