export function StatBar({
  label,
  value,
  segments = 16,
}: {
  label: string
  value: number
  segments?: number
}) {
  // value가 undefined, null, NaN일 경우 기본값 50(또는 0)으로 처리
  const safeValue = typeof value === "number" && !Number.isNaN(value) ? value : 50
  const filled = Math.round((safeValue / 100) * segments)

  return (
    <div
      className="po-sheen-soft flex items-center gap-2 px-2 py-1.5 pixel-soft"
      style={{ background: "var(--po-peach)" }}
    >
      <span
        className="font-pixel-sm w-[52px] shrink-0 text-[11px] leading-none"
        style={{ color: "var(--po-ink2)", textShadow: "1px 1px 0 rgba(255,255,255,0.5)" }}
      >
        {label}
      </span>
      <div
        className="relative flex h-4 flex-1 items-center gap-[2px] px-1 pixel-soft-in"
        style={{ background: "#fff4e2" }}
      >
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1"
            style={{
              background: i < filled ? "var(--po-peach-deep)" : "rgba(200,150,110,0.16)",
              boxShadow:
                i < filled
                  ? "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.15)"
                  : "none",
              borderRadius: 2,
              transition: "background 0.35s steps(4)",
            }}
          />
        ))}
      </div>
      <span
        className="font-pixel w-[26px] shrink-0 text-right text-[10px] leading-none"
        style={{ color: "var(--po-ink2)" }}
      >
        {safeValue}
      </span>
    </div>
  )
}