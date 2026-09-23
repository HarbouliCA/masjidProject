import { describe, it, expect } from "vitest";
import {
  buildMember,
  buildFamily,
  buildStudent,
  buildClass,
  buildTeacher,
  buildSalaryPayment,
  salaryDocId,
} from "./crud";

describe("buildMember", () => {
  it("defaults a new member to never_paid + active", () => {
    const m = buildMember({ fullName: "محمد بوصحابة", monthlyPledgeCents: 1000 });
    expect(m.status).toBe("never_paid");
    expect(m.isActive).toBe(true);
    expect(m.monthlyPledgeCents).toBe(1000);
  });

  it("rejects an empty name", () => {
    expect(() => buildMember({ fullName: "  ", monthlyPledgeCents: 1000 })).toThrow();
  });

  it("rejects a non-positive pledge", () => {
    expect(() => buildMember({ fullName: "x", monthlyPledgeCents: 0 })).toThrow();
  });
});

describe("buildFamily", () => {
  it("trims the parent name and keeps contact fields", () => {
    const f = buildFamily({ parentName: "  محمد بوصحابة ", phone: "612000000" });
    expect(f.parentName).toBe("محمد بوصحابة");
    expect(f.phone).toBe("612000000");
  });
});

describe("buildStudent", () => {
  it("requires a family and defaults level", () => {
    const s = buildStudent({ familyId: "fam-1", name: "اسماعيل" });
    expect(s.familyId).toBe("fam-1");
    expect(s.level).toBe("المستوى الأول");
  });

  it("accepts an optional class assignment", () => {
    const s = buildStudent({ familyId: "fam-1", name: "y", classId: "class-1" });
    expect(s.classId).toBe("class-1");
  });
});

describe("buildTeacher", () => {
  it("carries phone, email, monthly salary", () => {
    const t = buildTeacher({
      fullName: "أحمد",
      phone: "600000000",
      email: "a@x.com",
      monthlySalaryCents: 120000,
    });
    expect(t.email).toBe("a@x.com");
    expect(t.monthlySalaryCents).toBe(120000);
    expect(t.isActive).toBe(true);
  });

  it("rejects a negative salary", () => {
    expect(() => buildTeacher({ fullName: "x", monthlySalaryCents: -1 })).toThrow();
  });
});

describe("buildClass", () => {
  it("defaults to active and accepts a teacher", () => {
    const c = buildClass({ name: "المستوى الأول", teacherId: "t1" });
    expect(c.isActive).toBe(true);
    expect(c.teacherId).toBe("t1");
  });
});

describe("salary payments", () => {
  it("derives a stable, idempotent document id", () => {
    expect(salaryDocId("t1", "2026-01")).toBe("salary-t1-2026-01");
    expect(salaryDocId("t1", "2026-01")).toBe(salaryDocId("t1", "2026-01"));
  });

  it("derives status from expected vs paid", () => {
    expect(buildSalaryPayment({ teacherId: "t1", month: "2026-01", expectedCents: 120000, paidCents: 120000 }).status).toBe("paid");
    expect(buildSalaryPayment({ teacherId: "t1", month: "2026-01", expectedCents: 120000, paidCents: 0 }).status).toBe("unpaid");
  });
});
