"use client"

import { useEffect, useRef, useState } from "react"

export interface LogItem {
  id: string
  timestamp: string
  type: "log" | "error" | "warn" | "info"
  message: string
}

// 📌 전역 로그 저장소 (컴포넌트가 닫혀있거나 늦게 열려도 이전 로그가 유지됨)
const globalLogs: LogItem[] = []
const logListeners = new Set<(logs: LogItem[]) => void>()

function notifyListeners() {
  logListeners.forEach((listener) => listener([...globalLogs]))
}

function addLog(type: LogItem["type"], args: any[]) {
  const timestamp = new Date().toLocaleTimeString("ko-KR", { hour12: false })
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(" ")

  globalLogs.push({
    id: `${Date.now()}-${Math.random()}`,
    timestamp,
    type,
    message,
  })
  notifyListeners()
}

// 🚀 앱 로드 즉시 콘솔 및 전역 에러 가로채기 실행
if (typeof window !== "undefined" && !(window as any).__DEBUG_INTERCEPTOR_INIT__) {
  ;(window as any).__DEBUG_INTERCEPTOR_INIT__ = true

  const origLog = console.log
  const origErr = console.error
  const origWarn = console.warn
  const origInfo = console.info

  console.log = (...args: any[]) => {
    origLog(...args)
    addLog("log", args)
  }
  console.error = (...args: any[]) => {
    origErr(...args)
    addLog("error", args)
  }
  console.warn = (...args: any[]) => {
    origWarn(...args)
    addLog("warn", args)
  }
  console.info = (...args: any[]) => {
    origInfo(...args)
    addLog("info", args)
  }

  // JS 런타임 에러 수집
  window.addEventListener("error", (event) => {
    addLog("error", [`[Runtime Error] ${event.message} (${event.filename}:${event.lineno})`])
  })

  // 비동기 Promise 에러 수집
  window.addEventListener("unhandledrejection", (event) => {
    addLog("error", [`[Unhandled Promise Rejection] ${event.reason}`])
  })

  addLog("info", ["디버그 터미널 시스템이 활성화되었습니다."])
}

interface DebugConsoleProps {
  isOpen: boolean
  onClose?: () => void
}

export function DebugConsole({ isOpen, onClose }: DebugConsoleProps) {
  const [logs, setLogs] = useState<LogItem[]>([...globalLogs])
  const logContainerRef = useRef<HTMLDivElement | null>(null)

  // CMD 창 위치 이동 (드래그)
  const [pos, setPos] = useState({ x: 100, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const listener = (newLogs: LogItem[]) => setLogs(newLogs)
    logListeners.add(listener)
    return () => {
      logListeners.delete(listener)
    }
  }, [])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, isOpen])

  if (!isOpen) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleClear = () => {
    globalLogs.length = 0
    setLogs([])
  }

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join("\n")
    navigator.clipboard.writeText(text)
    alert("전체 로그가 클립보드에 복사되었습니다.")
  }

  return (
    <div
      className="fixed z-50 flex flex-col bg-black border-2 border-[#4deeea] rounded-lg shadow-2xl overflow-hidden font-mono text-xs w-[680px] h-[420px]"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 🖥️ CMD 상단 타이틀 바 (드래그 가능) */}
      <div
        className="flex items-center justify-between bg-[#11222d] border-b border-[#4deeea]/30 px-3 py-1.5 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="text-[#4deeea]">c:\&gt;</span>
          <span>System Debug Terminal (CMD)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 bg-[#1b3d48] hover:bg-[#285766] text-[#4deeea] rounded text-[10px]"
          >
            복사
          </button>
          <button
            onClick={handleClear}
            className="px-2 py-0.5 bg-[#1b3d48] hover:bg-[#285766] text-[#4deeea] rounded text-[10px]"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-red-900/80 hover:bg-red-700 text-white rounded text-[10px] font-bold ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 📟 CMD 블랙 터미널 화면 */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 bg-black text-[#5af78e] font-mono leading-relaxed selection:bg-[#4deeea] selection:text-black"
      >
        <div className="text-gray-500 mb-2 border-b border-gray-800 pb-1">
          Microsoft Windows [Version 10.0.19045.3803]
          <br />
          (c) Microsoft Corporation. All rights reserved.
        </div>

        {logs.length === 0 ? (
          <div className="text-gray-600 italic">C:\&gt; No active logs.</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2 ${
                log.type === "error"
                  ? "text-[#ff5555] font-semibold"
                  : log.type === "warn"
                  ? "text-[#f1fa8c]"
                  : log.type === "info"
                  ? "text-[#8be9fd]"
                  : "text-[#5af78e]"
              }`}
            >
              <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
              <span className="whitespace-pre-wrap break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>

      {/* 하단 입력 프롬프트 바 프레임 */}
      <div className="bg-[#0a0a0a] border-t border-gray-800 px-3 py-1 flex items-center gap-2 text-gray-400 text-[11px]">
        <span className="text-[#4deeea]">C:\Users\Admin&gt;</span>
        <span className="w-2 h-4 bg-[#5af78e] animate-pulse inline-block" />
      </div>
    </div>
  )
}