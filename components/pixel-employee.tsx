"use client"

import { useEffect, useState } from "react"
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

// ---------- 스프라이트 설정 ----------
const FRAME_W = 32 // 프레임 1개 가로(px)
const FRAME_H = 32 // 프레임 1개 세로(px)
const FRAME_COUNT = 3 // 시트의 프레임 수 (4프레임 시트로 바꾸면 4)
const FRAME_MS = 140 // 프레임 전환 간격(ms)
const SPRITE_SCALE = 1 // 맵 대비 크기 (캐릭터가 크면 0.75 등으로)

const SPRITES: Record<Direction, string> = {
  down: "/sprites/girldown.png",
  left: "/sprites/girlleft.png",
  right: "/sprites/girlright.png",
  up: "/sprites/girlup.png",
}

// 걷기 프레임 순서: 3프레임이면 0,1,2,1 / 그 외에는 순서대로
const WALK_SEQUENCE: number[] =
  FRAME_COUNT === 3
    ? [0, 1, 2, 1]
    : Array.from({ length: FRAME_COUNT }, (_, i) => i)

// 멈췄을 때 프레임 (3프레임 시트는 가운데가 서 있는 자세)
const IDLE_FRAME = FRAME_COUNT === 3 ? 1 : 0

// 방향 전환 시 깜빡임 방지용 미리 로드
let preloaded = false
function preloadSprites() {
  if (preloaded || typeof window === "undefined") return
  preloaded = true
  Object.values(SPRITES).forEach((src) => {
    const img = new Image()
    img.src = src
  })
}

export function PixelEmployee({
  employee,
  selected,
  onSelect,
  position,
  direction = "down",
  isMoving = false,
}: PixelEmployeeProps) {
  const meta = STATUS_META[employee.status] ?? {
    label: employee.status || "대기 중",
    color: "var(--po-mint)",
    dot: "#4ade80",
  }

  const [step, setStep] = useState(0)

  useEffect(() => {
    preloadSprites()
  }, [])

  // 움직일 때만 프레임 순환, 멈추면 서 있는 자세로 복귀
  useEffect(() => {
    if (!isMoving) {
      setStep(0)
      return
    }
    setStep(1)
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % WALK_SEQUENCE.length)
    }, FRAME_MS)
    return () => clearInterval(timer)
  }, [isMoving])

  const frame = isMoving ? WALK_SEQUENCE[step] : IDLE_FRAME

  const w = FRAME_W * SPRITE_SCALE
  const h = FRAME_H * SPRITE_SCALE

  const characterContent = (
    <button
      type="button"
      onClick={() => onSelect(employee.id)}
      title={`${employee.name} · ${employee.role} · ${meta.label}`}
      aria-pressed={selected}
      className="relative block select-none pointer-events-auto p-0 border-0 bg-transparent"
      style={{ width: `${w}px`, height: `${h}px` }}
    >
      {/* 선택 표시: 발밑 타원 */}
      {selected && (
        <span
          className="absolute left-1/2 rounded-full pointer-events-none"
          style={{
            bottom: -1,
            width: w * 0.6,
            height: 5,
            transform: "translateX(-50%)",
            background: "rgba(242,162,76,0.55)",
            outline: "1px solid var(--po-orange)",
          }}
        />
      )}

      {/* 스프라이트: 시트를 배경으로 두고 프레임 위치만 이동 */}
      <div
        role="img"
        aria-label={employee.name}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${SPRITES[direction]})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${FRAME_COUNT * w}px ${h}px`,
          backgroundPosition: `${-frame * w}px 0px`,
          imageRendering: "pixelated",
        }}
      />

      {/* 상태 닷: 머리 위 */}
      <span
        className="absolute z-10 rounded-full pointer-events-none"
        style={{
          top: 0,
          left: "50%",
          marginLeft: 5,
          width: 5,
          height: 5,
          background: meta.dot ?? "#4ade80",
          boxShadow: "0 0 0 1px var(--po-ink)",
        }}
      />

      {/* 이름표: 레이아웃에서 분리 → 컴포넌트 하단 = 발 위치 */}
      <span
        className="absolute left-1/2 whitespace-nowrap pointer-events-none rounded-[2px] text-white shadow"
        style={{
          top: "100%",
          marginTop: 1,
          transform: "translateX(-50%)",
          fontSize: 7,
          lineHeight: 1,
          padding: "1px 3px",
          background: selected ? "rgba(242,162,76,0.95)" : "rgba(0,0,0,0.8)",
        }}
      >
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