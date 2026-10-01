"use client"

import { useEffect, useRef, useState } from "react"
import { type Employee } from "@/lib/office-data"
import { PixelEmployee, type Direction } from "@/components/pixel-employee"

interface OfficeViewProps {
  employees: Employee[]
  selectedId: string | null
  onSelect: (id: string) => void
}

interface TilesetInfo {
  firstgid: number
  name: string
  tileWidth: number
  tileHeight: number
  imageSrc: string
  img?: HTMLImageElement
  columns: number
}

interface EmployeePos {
  x: number
  y: number
  path: { x: number; y: number }[]
  speed: number
  waitTime: number
  dir: Direction
  isMoving: boolean
}

// 🧠 A* (A-Star) 길찾기 알고리즘
interface Node {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: Node | null
}

function findPath(grid: number[][], start: { x: number; y: number }, target: { x: number; y: number }) {
  if (!grid || grid.length === 0 || !grid[0]) return []
  
  const height = grid.length
  const width = grid[0].length

  // 시작점이나 목적지가 범위 밖이거나 벽인 경우 예외 처리
  if (
    start.x < 0 || start.x >= width || start.y < 0 || start.y >= height ||
    target.x < 0 || target.x >= width || target.y < 0 || target.y >= height ||
    grid[target.y][target.x] === 1
  ) {
    return []
  }

  const openList: Node[] = []
  const closedList = new Set<string>()

  const startNode: Node = { x: start.x, y: start.y, g: 0, h: 0, f: 0, parent: null }
  openList.push(startNode)

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f)
    const current = openList.shift()!

    if (current.x === target.x && current.y === target.y) {
      const path = []
      let temp: Node | null = current
      while (temp) {
        path.push({ x: temp.x, y: temp.y })
        temp = temp.parent
      }
      return path.reverse()
    }

    closedList.add(`${current.x},${current.y}`)

    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
    ]

    for (const n of neighbors) {
      if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) continue
      if (grid[n.y][n.x] === 1) continue // 🧱 충돌 타일(1)이면 대기
      if (closedList.has(`${n.x},${n.y}`)) continue

      const g = current.g + 1
      const h = Math.abs(n.x - target.x) + Math.abs(n.y - target.y)
      const f = g + h

      const existingOpen = openList.find((o) => o.x === n.x && o.y === n.y)
      if (existingOpen) {
        if (g < existingOpen.g) {
          existingOpen.g = g
          existingOpen.f = f
          existingOpen.parent = current
        }
      } else {
        openList.push({ x: n.x, y: n.y, g, h, f, parent: current })
      }
    }
  }

  return []
}

const calculateDirection = (dx: number, dy: number): Direction => {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left"
  } else {
    return dy > 0 ? "down" : "up"
  }
}

export function OfficeView({ employees, selectedId, onSelect }: OfficeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState<{ tileX: number; tileY: number; px: number; py: number } | null>(null)

  const collisionGridRef = useRef<number[][]>([])
  const positionsRef = useRef<Record<string, EmployeePos>>({})
  const [, setRenderTrigger] = useState(0)

  // 1. A* 길찾기 기반 직원 실시간 위치 이동 루프
  useEffect(() => {
    const timer = setInterval(() => {
      const currentMap = positionsRef.current
      const grid = collisionGridRef.current

      if (!grid || grid.length === 0) return

      const height = grid.length
      const width = grid[0].length

      // 아직 위치가 생성 안 된 직원이 있으면 초기 빈 타일 위치 지정
      employees.forEach((emp) => {
        if (!currentMap[emp.id]) {
          let rx = Math.floor(Math.random() * width)
          let ry = Math.floor(Math.random() * height)
          
          while (grid[ry]?.[rx] === 1) {
            rx = Math.floor(Math.random() * width)
            ry = Math.floor(Math.random() * height)
          }

          currentMap[emp.id] = {
            x: rx * 32 + 16,
            y: ry * 32 + 16,
            path: [],
            speed: 1.2 + Math.random() * 0.4,
            waitTime: Math.floor(Math.random() * 30),
            dir: "down",
            isMoving: false,
          }
        }
      })

      Object.keys(currentMap).forEach((id) => {
        const p = currentMap[id]
        if (!p) return

        if (p.waitTime > 0) {
          p.waitTime -= 1
          p.isMoving = false
          return
        }

        // 남은 경로가 없으면 이동 가능한 새로운 랜덤 타일 목적지 선택 및 길찾기 수행
        if (!p.path || p.path.length === 0) {
          const currentTileX = Math.floor(p.x / 32)
          const currentTileY = Math.floor(p.y / 32)

          let targetTileX = Math.floor(Math.random() * width)
          let targetTileY = Math.floor(Math.random() * height)

          let attempts = 0
          while (grid[targetTileY]?.[targetTileX] === 1 && attempts < 50) {
            targetTileX = Math.floor(Math.random() * width)
            targetTileY = Math.floor(Math.random() * height)
            attempts++
          }

          const newPath = findPath(
            grid,
            { x: currentTileX, y: currentTileY },
            { x: targetTileX, y: targetTileY }
          )

          if (newPath.length > 1) {
            p.path = newPath.slice(1).map((t) => ({ x: t.x * 32 + 16, y: t.y * 32 + 16 }))
          } else {
            p.waitTime = 40
          }
          return
        }

        // 경로 경유지 타일 따라 움직이기
        const target = p.path[0]
        const dx = target.x - p.x
        const dy = target.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 4) {
          p.x = target.x
          p.y = target.y
          p.path.shift()
          if (p.path.length === 0) {
            p.waitTime = Math.floor(Math.random() * 80) + 40
          }
        } else {
          p.isMoving = true
          p.dir = calculateDirection(dx, dy)
          p.x += (dx / dist) * p.speed
          p.y += (dy / dist) * p.speed
        }
      })

      setRenderTrigger((prev) => prev + 1)
    }, 20)

    return () => clearInterval(timer)
  }, [employees.length])

  // 2. TMX & TSX 로드 및 충돌 레이어 읽어오기
  useEffect(() => {
    async function loadAndRenderTmx() {
      try {
        const res = await fetch("/maps/map.tmx")
        if (!res.ok) throw new Error(`TMX 로드 실패 (Status: ${res.status})`)

        const xmlText = await res.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, "text/xml")

        const mapNode = xmlDoc.querySelector("map")
        if (!mapNode) throw new Error("<map> 태그를 찾을 수 없습니다.")

        const width = parseInt(mapNode.getAttribute("width") || "0", 10)
        const height = parseInt(mapNode.getAttribute("height") || "0", 10)
        const tileWidth = parseInt(mapNode.getAttribute("tilewidth") || "0", 10)
        const tileHeight = parseInt(mapNode.getAttribute("tileheight") || "0", 10)

        const tilesetNodes = Array.from(xmlDoc.querySelectorAll("tileset"))
        const tilesets: TilesetInfo[] = []

        for (const ts of tilesetNodes) {
          const firstgid = parseInt(ts.getAttribute("firstgid") || "1", 10)
          let tsTileWidth = parseInt(ts.getAttribute("tilewidth") || `${tileWidth}`, 10)
          let tsTileHeight = parseInt(ts.getAttribute("tileheight") || `${tileHeight}`, 10)
          let columns = parseInt(ts.getAttribute("columns") || "0", 10)
          let fileName = ""

          const tsxSource = ts.getAttribute("source")

          if (tsxSource) {
            const tsxFileName = tsxSource.split("/").pop() || tsxSource
            const tsxRes = await fetch(`/maps/${tsxFileName}`)
            if (tsxRes.ok) {
              const tsxText = await tsxRes.text()
              const tsxDoc = parser.parseFromString(tsxText, "text/xml")
              const tsxNode = tsxDoc.querySelector("tileset")
              if (tsxNode) {
                tsTileWidth = parseInt(tsxNode.getAttribute("tilewidth") || `${tileWidth}`, 10)
                tsTileHeight = parseInt(tsxNode.getAttribute("tileheight") || `${tileHeight}`, 10)
                columns = parseInt(tsxNode.getAttribute("columns") || "0", 10)
                const imgNode = tsxNode.querySelector("image")
                if (imgNode) {
                  const rawSource = imgNode.getAttribute("source") || ""
                  fileName = rawSource.split("/").pop() || rawSource
                }
              }
            }
          } else {
            const imgNode = ts.querySelector("image")
            if (imgNode) {
              const rawSource = imgNode.getAttribute("source") || ""
              fileName = rawSource.split("/").pop() || rawSource
            }
          }

          if (fileName) {
            tilesets.push({
              firstgid,
              name: ts.getAttribute("name") || "",
              tileWidth: tsTileWidth,
              tileHeight: tsTileHeight,
              imageSrc: `/maps/${fileName}`,
              columns,
            })
          }
        }

        await Promise.all(
          tilesets.map(
            (ts) =>
              new Promise<void>((resolve) => {
                const img = new Image()
                img.src = ts.imageSrc
                img.onload = () => {
                  ts.img = img
                  if (!ts.columns || ts.columns === 0) {
                    ts.columns = Math.floor(img.width / ts.tileWidth)
                  }
                  resolve()
                }
                img.onerror = () => resolve()
              })
          )
        )

        tilesets.sort((a, b) => b.firstgid - a.firstgid)

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = width * tileWidth
        canvas.height = height * tileHeight

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const layers = Array.from(xmlDoc.querySelectorAll("layer"))

        layers.forEach((layer) => {
          const layerName = layer.getAttribute("name") || ""
          const offsetX = parseInt(layer.getAttribute("offsetx") || "0", 10)
          const offsetY = parseInt(layer.getAttribute("offsety") || "0", 10)

          const dataNode = layer.querySelector("data")
          if (!dataNode) return

          const encoding = dataNode.getAttribute("encoding")
          let tileGids: number[] = []

          if (encoding === "csv") {
            tileGids = dataNode.textContent
              ? dataNode.textContent.trim().split(",").map((v) => parseInt(v.trim(), 10))
              : []
          } else {
            const tileNodes = Array.from(dataNode.querySelectorAll("tile"))
            tileGids = tileNodes.map((t) => parseInt(t.getAttribute("gid") || "0", 10))
          }

          // 🧱 Collision 레이어 데이터 파싱 -> 그리드 변환 (화면에는 렌더링 안 함)
          if (layerName.toLowerCase().includes("collision") || layerName.toLowerCase().includes("wall")) {
            const grid: number[][] = []
            for (let y = 0; y < height; y++) {
              const row: number[] = []
              for (let x = 0; x < width; x++) {
                const gid = tileGids[y * width + x] || 0
                row.push(gid > 0 ? 1 : 0)
              }
              grid.push(row)
            }
            collisionGridRef.current = grid
            return // Collision 레이어는 캔버스 렌더링 스킵 (투명 처리)
          }

          // 일반 배경/가구 레이어 Canvas에 그리기
          tileGids.forEach((gid, index) => {
            if (gid === 0) return

            const ts = tilesets.find((t) => gid >= t.firstgid)
            if (!ts || !ts.img) return

            const localId = gid - ts.firstgid
            const cols = ts.columns || Math.floor(ts.img.width / ts.tileWidth)

            const sourceX = (localId % cols) * ts.tileWidth
            const sourceY = Math.floor(localId / cols) * ts.tileHeight

            const targetX = (index % width) * tileWidth + offsetX
            const targetY = Math.floor(index / width) * tileHeight + offsetY

            ctx.drawImage(
              ts.img,
              sourceX,
              sourceY,
              ts.tileWidth,
              ts.tileHeight,
              targetX,
              targetY,
              tileWidth,
              tileHeight
            )
          })
        })
      } catch (error) {
        console.error("[TMX Render Error]", error)
      }
    }

    loadAndRenderTmx()
  }, [])

  // 3. passive: false 휠 조작
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      const zoomFactor = 0.1
      setScale((prevScale) => {
        const newScale = e.deltaY < 0 ? prevScale + zoomFactor : prevScale - zoomFactor
        return Math.min(Math.max(0.3, newScale), 3)
      })
    }

    container.addEventListener("wheel", handleWheelNative, { passive: false })
    return () => {
      container.removeEventListener("wheel", handleWheelNative)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const rawX = (e.clientX - rect.left) / scale
      const rawY = (e.clientY - rect.top) / scale

      const tileX = Math.floor(rawX / 32)
      const tileY = Math.floor(rawY / 32)

      if (tileX >= 0 && tileY >= 0 && tileX < 43 && tileY < 24) {
        setMousePos({
          tileX,
          tileY,
          px: Math.round(rawX),
          py: Math.round(rawY),
        })
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleResetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden flex justify-center items-center cursor-grab active:cursor-grabbing select-none"
      style={{ background: "var(--po-sky)" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 상태 표시 바 */}
      <div className="absolute top-4 right-4 z-10 flex gap-3 bg-black/80 px-3 py-2 rounded-lg backdrop-blur text-white text-xs font-mono border border-gray-700 shadow-xl">
        {mousePos && (
          <div className="flex items-center gap-2 text-[#5af78e] border-r border-gray-600 pr-3">
            <span>Tile: ({mousePos.tileX}, {mousePos.tileY})</span>
            <span className="text-gray-400 text-[11px]">PX: ({mousePos.px}, {mousePos.py})</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span>배율: {Math.round(scale * 100)}%</span>
          <button
            onClick={handleResetView}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/40 rounded transition text-[11px]"
          >
            원래대로
          </button>
        </div>
      </div>

      <div
        className="transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          className="pixel-edge inline-block relative"
          style={{ background: "var(--po-ink)", padding: "8px" }}
        >
          <canvas ref={canvasRef} className="pixel-edge block" />

          {/* 🚶‍♂️ 직원 오버레이 레이어 */}
          <div className="absolute inset-2 pointer-events-none">
            {employees.map((emp) => {
              const pos = positionsRef.current[emp.id]
              if (!pos) return null

              return (
                <PixelEmployee
                  key={emp.id}
                  employee={emp}
                  position={{ x: pos.x, y: pos.y }}
                  direction={pos.dir}
                  isMoving={pos.isMoving}
                  selected={selectedId === emp.id}
                  onSelect={onSelect}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}