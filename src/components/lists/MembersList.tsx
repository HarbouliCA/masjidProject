"use client";

import { useMembers } from "@/lib/data/hooks";
import { DirectoryList, type Column } from "../DirectoryList";
import { Money } from "../Money";
import type { Dictionary, TranslationKey } from "@/i18n";
import type { Member } from "@/lib/schema";

export function MembersList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useMembers();

  const columns: Column<Member>[] = [
    { key: "fullName", header: t.name, cell: (m) => <span dir="auto">{m.fullName}</span> },
    {
      key: "monthlyPledgeCents",
      header: t.monthlyPledge,
      cell: (m) => <Money cents={m.monthlyPledgeCents} />,
    },
    {
      key: "status",
      header: t.status,
      cell: (m) => t[`status_${m.status}` as TranslationKey],
    },
  ];

  return (
    <DirectoryList
      t={t}
      title={t.members}
      columns={columns}
      rows={data}
      isLoading={isLoading}
      searchText={(m) => m.fullName}
    />
  );
}
