"use client"

import { useEffect, useState } from "react"

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div
      className="po-sheen-soft flex items-center gap-2 px-2.5 py-1 pixel-soft-sm"
      style={{ background: "var(--po-panel-light)" }}
    >
      <span
        className="h-4 w-4 shrink-0 pixel-soft-in"
        style={{ background: accent, borderRadius: 5 }}
        aria-hidden
      />
      <div className="flex flex-col leading-none">
        <span className="font-pixel-sm text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>
          {label}
        </span>
        <span className="font-pixel text-[12px]" style={{ color: "var(--po-ink2)" }}>
          {value}
        </span>
      </div>
    </div>
  )
}

export function TopBar({
  activeStaff,
  totalStaff,
  activeTasks,
  doneTasks,
  running,
  currentView = "map",
  isDebugOpen = false,
  onNavigate,
  onToggleRun,
  onToggleDebug,
}: {
  activeStaff: number
  totalStaff: number
  activeTasks: number
  doneTasks: number
  running: boolean
  currentView?: "map" | "admin"
  isDebugOpen?: boolean
  onNavigate?: (view: "map" | "admin") => void
  onToggleRun: () => void
  onToggleDebug?: () => void
}) {
  const [clock, setClock] = useState("--:--:--")

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("ko-KR", {
          hour12: false,
        }),
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className="po-sheen-soft flex items-center gap-3 px-3 py-2.5"
      style={{
        background: "linear-gradient(180deg, #fff6ea 0%, #fdecd4 100%)",
        borderBottom: "3px solid var(--po-line)",
      }}
    >
      {/* window dots */}
      <div className="flex items-center gap-1.5 pr-1">
        <span className="h-3 w-3 pixel-soft-sm" style={{ background: "var(--po-coral)", borderRadius: 999 }} />
        <span className="h-3 w-3 pixel-soft-sm" style={{ background: "var(--po-lemon)", borderRadius: 999 }} />
        <span className="h-3 w-3 pixel-soft-sm" style={{ background: "var(--po-mint)", borderRadius: 999 }} />
      </div>

      {/* brand */}
      <div className="flex items-center gap-2">
        <span
          className="po-sheen-soft font-pixel flex h-8 w-8 items-center justify-center text-[15px] pixel-soft"
          style={{ background: "var(--po-peach)", color: "#fff" }}
        >
          P
        </span>
        <div className="leading-none">
          <p className="font-pixel text-[16px]" style={{ color: "var(--po-ink2)" }}>
            AI
          </p>
          <p className="font-pixel-sm text-[11px]" style={{ color: "var(--po-peach-deep)" }}>
            COMPANY
          </p>
        </div>
      </div>

      <div className="mx-1 hidden items-center gap-2 md:flex">
        <Metric label="근무중" value={`${activeStaff}/${totalStaff}`} accent="var(--po-mint)" />
        <Metric label="진행 작업" value={String(activeTasks)} accent="var(--po-peach)" />
        <Metric label="완료" value={String(doneTasks)} accent="var(--po-sky2)" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* 🛠️ 디버그 모드 버튼 (관리자 설정 왼쪽) */}
        <button
          type="button"
          onClick={onToggleDebug}
          className="po-sheen-soft font-pixel-sm flex items-center gap-1 px-2.5 py-1.5 text-[11px] pixel-soft transition-transform active:translate-y-[2px]"
          style={{
            background: isDebugOpen ? "#ff6b6b" : "var(--po-panel-light)",
            color: isDebugOpen ? "#ffffff" : "var(--po-ink2)",
          }}
        >
          🐞 디버그 모드 {isDebugOpen ? "ON" : "OFF"}
        </button>

        {/* 🎯 관리자 / 맵 전환 버튼 */}
        {currentView === "admin" ? (
          <button
            type="button"
            onClick={() => onNavigate?.("map")}
            className="po-sheen-soft font-pixel-sm flex items-center gap-1 px-2.5 py-1.5 text-[11px] pixel-soft transition-transform active:translate-y-[2px]"
            style={{
              background: "var(--po-mint)",
              color: "var(--po-ink2)",
            }}
          >
            🏢 오피스 맵 보기
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate?.("admin")}
            className="po-sheen-soft font-pixel-sm flex items-center gap-1 px-2.5 py-1.5 text-[11px] pixel-soft transition-transform active:translate-y-[2px]"
            style={{
              background: "var(--po-panel-light)",
              color: "var(--po-ink2)",
            }}
          >
            ⚙️ 관리자 설정
          </button>
        )}

        {/* 시계 */}
        <span
          className="font-pixel hidden px-2.5 py-1.5 text-[11px] pixel-soft-in sm:inline-block"
          style={{ background: "#eaf7f0", color: "#3f9f78" }}
        >
          {clock}
        </span>

        {/* 일시정지 / 재생 */}
        <button
          type="button"
          onClick={onToggleRun}
          className="po-sheen-soft font-pixel-sm flex items-center gap-1.5 px-3 py-1.5 text-[11px] pixel-soft transition-transform active:translate-y-[2px]"
          style={{
            background: running ? "var(--po-mint)" : "var(--po-lemon)",
            color: "var(--po-ink2)",
          }}
        >
          <span
            className="po-status-live h-2 w-2"
            style={{ background: running ? "var(--po-mint-deep)" : "var(--po-peach-deep)", borderRadius: 999 }}
          />
          {running ? "실시간 · 재생중" : "일시정지"}
        </button>
      </div>
    </header>
  )
}