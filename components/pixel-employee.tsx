"use client"

import { STATUS_META, type Employee } from "@/lib/office-data"

export type Direction = "left" | "right" | "up" | "down"

interface PixelEmployeeProps {
  employee: Employee
  selected: boolean
  onSelect: (id: string) => void
  position?: { x: number; y: number }
  direction?: Direction
  isMoving?: boolean
}

export function PixelEmployee({
  employee,
  selected,
  onSelect,
  position,
}: PixelEmployeeProps) {
  // STATUS_META[employee.status]가 undefined일 경우를 대비한 방어 코드
  const meta = STATUS_META[employee.status] ?? {
    label: employee.status || "대기 중",
    color: "var(--po-mint)",
    dot: "#4ade80",
  }

  // 단일 캐릭터 이미지 경로
  const spriteImage = "/sprites/girl1.png"

  const characterContent = (
    <button
      type="button"
      onClick={() => onSelect(employee.id)}
      title={`${employee.name} · ${employee.role} · ${meta?.label ?? "대기 중"}`}
      aria-pressed={selected}
      className="group relative flex flex-col items-center gap-0.5 rounded-[3px] p-0.5 transition-colors select-none pointer-events-auto"
      style={{
        background: selected ? "rgba(242,162,76,0.3)" : "transparent",
        outline: selected ? "2px solid var(--po-orange)" : "2px solid transparent",
      }}
    >
      {/* 상태 닷 */}
      <span
        className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full z-10"
        style={{
          background: meta?.dot ?? "#4ade80",
          boxShadow: "0 0 0 1.5px var(--po-ink)",
        }}
      />

      {/* 🎯 시원하게 확대한 캐릭터 뷰포트 (가로 56px, 세로 80px) */}
      <div className="relative w-[56px] h-[80px] shrink-0 flex items-center justify-center overflow-hidden">
        <img
          src={spriteImage}
          alt={employee.name}
          className="w-full h-full object-contain pointer-events-none drop-shadow-md"
          style={{
            imageRendering: "pixelated",
          }}
        />
      </div>

      {/* 이름표 */}
      <span className="font-pixel-sm max-w-[72px] truncate text-[10px] leading-none px-1.5 py-0.5 bg-black/80 text-white rounded mt-0.5 shrink-0 pointer-events-none shadow">
        {employee.name}
      </span>
    </button>
  )

  // position 전달 시 발 위치 기준으로 정렬
  if (position) {
    return (
      <div
        className="absolute pointer-events-auto select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        {characterContent}
      </div>
    )
  }

  return characterContent
}