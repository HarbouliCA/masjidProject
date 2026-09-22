"use client";

import { useStudents } from "@/lib/data/hooks";
import { DirectoryList, type Column } from "../DirectoryList";
import type { Dictionary } from "@/i18n";
import type { Student } from "@/lib/schema";

export function StudentsList({ t }: { t: Dictionary }) {
  const { data = [], isLoading } = useStudents();

  const columns: Column<Student>[] = [
    { key: "name", header: t.name, cell: (s) => <span dir="auto">{s.name}</span> },
    { key: "level", header: t.level, cell: (s) => s.level },
    {
      key: "english",
      header: t.english,
      cell: (s) => (s.englishEnrolled ? t.yes : t.no),
    },
  ];

  return (
    <DirectoryList
      t={t}
      title={t.students}
      columns={columns}
      rows={data}
      isLoading={isLoading}
      searchText={(s) => s.name}
    />
  );
}
