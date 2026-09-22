"use client";

import { useTeachers } from "@/lib/data/hooks";
import { DirectoryList, type Column } from "../DirectoryList";
import type { Dictionary } from "@/i18n";
import type { Teacher } from "@/lib/schema";

export function TeachersList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useTeachers();

  const columns: Column<Teacher>[] = [
    { key: "fullName", header: t.name, cell: (x) => <span dir="auto">{x.fullName}</span> },
    {
      key: "phone",
      header: t.phone,
      cell: (x) => <span dir="ltr">{x.phone ?? "—"}</span>,
    },
  ];

  return (
    <DirectoryList
      t={t}
      title={t.teachers}
      columns={columns}
      rows={data}
      isLoading={isLoading}
      searchText={(x) => x.fullName}
    />
  );
}
