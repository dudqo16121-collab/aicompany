"use client"

import { PixelEmployee } from "@/components/pixel-employee"
import type { Department, Employee } from "@/lib/office-data"

export function DepartmentRoom({
  dept,
  employees,
  selectedId,
  onSelect,
}: {
  dept: Department
  employees: Employee[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const activeCount = employees.filter(
    (e) => e.status === "working" || e.status === "meeting",
  ).length

  return (
    <section
      className="relative flex min-h-[168px] flex-col pixel-edge"
      style={{ background: dept.floor }}
      aria-label={dept.name}
    >
      {/* wall strip */}
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{ background: dept.wall, boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.28)" }}
      >
        <span
          className="font-pixel inline-block px-2 py-0.5 text-[11px] pixel-edge-sm"
          style={{ background: "var(--po-tan)", color: "var(--po-ink)" }}
        >
          {dept.name}
        </span>
        <span className="font-pixel-sm text-[10px]" style={{ color: "var(--po-cream)" }}>
          {activeCount}/{employees.length} 근무
        </span>
      </div>

      {/* floor with subtle tile grid */}
      <div
        className="relative flex flex-1 flex-wrap content-start items-start gap-1 p-2"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        {employees.map((e) => (
          <PixelEmployee
            key={e.id}
            employee={e}
            selected={selectedId === e.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}
