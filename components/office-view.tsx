"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { type Employee } from "@/lib/office-data"
import { PixelEmployee } from "@/components/pixel-employee"

interface OfficeViewProps {
  employees: Employee[]
  selectedId: string | null
  onSelect: (id: string) => void
}

interface AnimFrame {
  tileid: number
  duration: number // ms
}

interface TileAnimation {
  frames: AnimFrame[]
  total: number
}

interface TilesetInfo {
  firstgid: number
  name: string
  tileWidth: number
  tileHeight: number
  columns: number
  tileCount: number
  margin: number
  spacing: number
  image?: HTMLImageElement // 스프라이트시트 방식
  tileImages: Map<number, HTMLImageElement> // 이미지 컬렉션 방식
  animations: Map<number, TileAnimation> // Tiled 애니메이션
}

type Dir = "left" | "right" | "up" | "down"
type Point = { x: number; y: number }
type Flags = { h: boolean; v: boolean; d: boolean }

interface EmployeeState {
  id: string
  x: number
  y: number
  path: Point[]
  waitTime: number // ms
  direction: Dir
  isMoving: boolean
}

interface AnimatedTile {
  x: number
  y: number
  ts: TilesetInfo
  localId: number
  flags: Flags
  anim: TileAnimation
}

interface LayerCache {
  base: HTMLCanvasElement // 정적 타일
  animated: AnimatedTile[] // 애니메이션 타일
}

const TILE_SIZE = 16
const MAP_WIDTH = 56
const MAP_HEIGHT = 24

const MIN_SCALE = 1
const MAX_SCALE = 6
const DEFAULT_SCALE = 2

const MOVE_SPEED = 0.035 // px per ms (35px/s)

// Tiled flip flags
const FLIP_H = 0x80000000
const FLIP_V = 0x40000000
const FLIP_D = 0x20000000
const GID_MASK = 0x1fffffff

// 오브젝트가 타일을 막으려면 가로/세로 모두 이 픽셀 이상 겹쳐야 함
const OBJECT_OVERLAP_MIN = 3

// 새로 추가된 직원이 나타날 위치 (맵 px, 발 기준)
const NEW_EMPLOYEE_SPAWN = { x: 787, y: 37 }

// 맵이 준비된 뒤 이 시간 이내에 들어온 직원은 "초기 로딩 직원"으로 간주 (랜덤 스폰)
const INITIAL_LOAD_WINDOW_MS = 2000

// ---------- 유틸 ----------

function parseCsv(text: string): number[] {
  return text
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v !== "")
    .map((v) => parseInt(v, 10))
}

function loadImage(src: string, failed: string[]): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      console.warn("[이미지 로드 실패]", src)
      failed.push(src)
      resolve(null)
    }
    img.src = src
  })
}

function baseName(path: string): string {
  return path.split("/").pop() || path
}

// 외부 .tsx 파일까지 포함해서 타일셋 로드 (애니메이션 포함)
async function loadTilesets(xmlDoc: Document, failed: string[]): Promise<TilesetInfo[]> {
  const nodes = Array.from(xmlDoc.querySelectorAll("map > tileset"))

  const result = await Promise.all(
    nodes.map(async (node): Promise<TilesetInfo | null> => {
      const firstgid = parseInt(node.getAttribute("firstgid") || "1", 10)
      let root: Element = node

      const source = node.getAttribute("source")
      if (source) {
        try {
          const res = await fetch(`/maps/${baseName(source)}`)
          if (!res.ok) throw new Error(`status ${res.status}`)
          const text = await res.text()
          const doc = new DOMParser().parseFromString(text, "text/xml")
          root = doc.documentElement
        } catch (e) {
          console.warn("[TSX 로드 실패]", source, e)
          failed.push(`/maps/${baseName(source)}`)
          return null
        }
      }

      const tileWidth = parseInt(root.getAttribute("tilewidth") || `${TILE_SIZE}`, 10)
      const tileHeight = parseInt(root.getAttribute("tileheight") || `${TILE_SIZE}`, 10)
      const info: TilesetInfo = {
        firstgid,
        name: root.getAttribute("name") || "",
        tileWidth,
        tileHeight,
        columns: parseInt(root.getAttribute("columns") || "0", 10),
        tileCount: parseInt(root.getAttribute("tilecount") || "0", 10),
        margin: parseInt(root.getAttribute("margin") || "0", 10),
        spacing: parseInt(root.getAttribute("spacing") || "0", 10),
        tileImages: new Map(),
        animations: new Map(),
      }

      const children = Array.from(root.children)

      // 스프라이트시트 (tileset 직속 image)
      const sheetNode = children.find((c) => c.tagName === "image")
      if (sheetNode) {
        const img = await loadImage(`/maps/${baseName(sheetNode.getAttribute("source") || "")}`, failed)
        if (img) {
          info.image = img
          if (!info.columns) {
            info.columns = Math.floor(
              (img.width - info.margin * 2 + info.spacing) / (tileWidth + info.spacing)
            )
          }
          if (!info.tileCount) {
            const rows = Math.floor(
              (img.height - info.margin * 2 + info.spacing) / (tileHeight + info.spacing)
            )
            info.tileCount = info.columns * rows
          }
        }
      }

      // tile 노드: 이미지 컬렉션 + 애니메이션
      const tileNodes = children.filter((c) => c.tagName === "tile")
      await Promise.all(
        tileNodes.map(async (t) => {
          const id = parseInt(t.getAttribute("id") || "0", 10)

          // 애니메이션 프레임
          const animNode = Array.from(t.children).find((c) => c.tagName === "animation")
          if (animNode) {
            const frames: AnimFrame[] = Array.from(animNode.children)
              .filter((f) => f.tagName === "frame")
              .map((f) => ({
                tileid: parseInt(f.getAttribute("tileid") || "0", 10),
                duration: Math.max(1, parseInt(f.getAttribute("duration") || "100", 10)),
              }))
            if (frames.length > 0) {
              info.animations.set(id, {
                frames,
                total: frames.reduce((sum, f) => sum + f.duration, 0),
              })
            }
          }

          // 이미지 컬렉션
          const imgNode = Array.from(t.children).find((c) => c.tagName === "image")
          if (imgNode) {
            const img = await loadImage(`/maps/${baseName(imgNode.getAttribute("source") || "")}`, failed)
            if (img) info.tileImages.set(id, img)
          }
        })
      )

      return info
    })
  )

  return result.filter((t): t is TilesetInfo => t !== null).sort((a, b) => b.firstgid - a.firstgid)
}

// 현재 시간에 맞는 애니메이션 프레임의 tileid
function pickFrame(anim: TileAnimation, time: number): number {
  let t = time % anim.total
  for (const f of anim.frames) {
    if (t < f.duration) return f.tileid
    t -= f.duration
  }
  return anim.frames[0].tileid
}

// 타일 1개 그리기 (flip + 하단 정렬)
function drawTile(
  ctx: CanvasRenderingContext2D,
  ts: TilesetInfo,
  localId: number,
  flags: Flags,
  cellX: number,
  cellY: number
) {
  let img: HTMLImageElement | undefined
  let sx = 0
  let sy = 0
  const sw = ts.tileWidth
  const sh = ts.tileHeight

  if (ts.image && ts.columns > 0) {
    img = ts.image
    const col = localId % ts.columns
    const row = Math.floor(localId / ts.columns)
    sx = ts.margin + col * (sw + ts.spacing)
    sy = ts.margin + row * (sh + ts.spacing)
  } else {
    img = ts.tileImages.get(localId)
    if (!img) return
  }

  const isSheet = img === ts.image
  const dw = isSheet ? sw : img.width
  const dh = isSheet ? sh : img.height
  const dx = cellX
  const dy = cellY + TILE_SIZE - dh // Tiled 방식: 셀 하단 기준

  ctx.save()
  ctx.translate(dx + dw / 2, dy + dh / 2)
  ctx.scale(flags.h ? -1 : 1, flags.v ? -1 : 1)
  if (flags.d) ctx.transform(0, 1, 1, 0, 0, 0)
  if (isSheet) {
    ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh)
  } else {
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
  }
  ctx.restore()
}

// 레이어 캐시를 순서대로 합성
function renderMap(ctx: CanvasRenderingContext2D, layers: LayerCache[], time: number) {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
  for (const layer of layers) {
    ctx.drawImage(layer.base, 0, 0)
    for (const a of layer.animated) {
      drawTile(ctx, a.ts, pickFrame(a.anim, time), a.flags, a.x, a.y)
    }
  }
}

// 현재 애니메이션 프레임 조합 (바뀔 때만 다시 그리기 위함)
function animSignature(layers: LayerCache[], time: number): string {
  let sig = ""
  for (const layer of layers) {
    for (const a of layer.animated) sig += pickFrame(a.anim, time) + ","
  }
  return sig
}

// BFS 길찾기
function findPath(grid: number[][], start: Point, target: Point): Point[] {
  if (
    target.x < 0 || target.x >= MAP_WIDTH ||
    target.y < 0 || target.y >= MAP_HEIGHT ||
    grid[target.y]?.[target.x] === 1
  ) return []

  const queue: Point[] = [start]
  let head = 0
  const visited = new Set<string>([`${start.x},${start.y}`])
  const parent = new Map<string, Point>()
  const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]

  while (head < queue.length) {
    const current = queue[head++]
    if (current.x === target.x && current.y === target.y) {
      const path: Point[] = []
      let curr = current
      while (curr.x !== start.x || curr.y !== start.y) {
        path.push(curr)
        curr = parent.get(`${curr.x},${curr.y}`)!
      }
      return path.reverse()
    }

    for (const dir of dirs) {
      const nx = current.x + dir.x
      const ny = current.y + dir.y
      const key = `${nx},${ny}`
      if (
        nx >= 0 && nx < MAP_WIDTH &&
        ny >= 0 && ny < MAP_HEIGHT &&
        grid[ny][nx] !== 1 && !visited.has(key)
      ) {
        visited.add(key)
        parent.set(key, current)
        queue.push({ x: nx, y: ny })
      }
    }
  }
  return []
}

// 가장 큰 이동 가능 영역(연결 요소)의 타일 목록
function findLargestWalkableRegion(grid: number[][]): Point[] {
  const visited = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(false))
  let best: Point[] = []
  const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (grid[y][x] === 1 || visited[y][x]) continue
      const region: Point[] = []
      const stack: Point[] = [{ x, y }]
      visited[y][x] = true
      while (stack.length) {
        const c = stack.pop()!
        region.push(c)
        for (const d of dirs) {
          const nx = c.x + d.x
          const ny = c.y + d.y
          if (
            nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
            grid[ny][nx] !== 1 && !visited[ny][nx]
          ) {
            visited[ny][nx] = true
            stack.push({ x: nx, y: ny })
          }
        }
      }
      if (region.length > best.length) best = region
    }
  }
  return best
}

function getDirection(dx: number, dy: number): Dir {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left"
  return dy > 0 ? "down" : "up"
}

const tileCenter = (t: Point): Point => ({
  x: t.x * TILE_SIZE + TILE_SIZE / 2,
  y: t.y * TILE_SIZE + TILE_SIZE / 2,
})

function getDoorSpawn(walkable: Point[]): Point {
  const tx = Math.floor(NEW_EMPLOYEE_SPAWN.x / TILE_SIZE)
  const ty = Math.floor(NEW_EMPLOYEE_SPAWN.y / TILE_SIZE)

  // 지정 좌표가 이동 가능한 칸이면 그대로 사용
  if (walkable.some((t) => t.x === tx && t.y === ty)) {
    return { x: NEW_EMPLOYEE_SPAWN.x, y: NEW_EMPLOYEE_SPAWN.y }
  }

  // 아니면 가장 가까운 이동 가능 칸으로 보정
  let best = walkable[0]
  let bestDist = Infinity
  for (const t of walkable) {
    const d = (t.x - tx) ** 2 + (t.y - ty) ** 2
    if (d < bestDist) {
      bestDist = d
      best = t
    }
  }
  const c = tileCenter(best)
  console.warn(
    `[스폰 보정] (${NEW_EMPLOYEE_SPAWN.x}, ${NEW_EMPLOYEE_SPAWN.y}) 타일 (${tx}, ${ty})이 막혀 있거나 고립되어 (${c.x}, ${c.y})로 이동됨`
  )
  return c
}

// 직원 이동 (순수 함수, dt는 ms)
function stepEmployee(
  emp: EmployeeState,
  grid: number[][],
  walkable: Point[],
  dt: number
): EmployeeState {
  if (emp.path.length === 0) {
    if (emp.waitTime > 0) {
      return { ...emp, isMoving: false, waitTime: Math.max(0, emp.waitTime - dt) }
    }
    if (walkable.length === 0) return { ...emp, isMoving: false }

    const cur = { x: Math.floor(emp.x / TILE_SIZE), y: Math.floor(emp.y / TILE_SIZE) }
    let path: Point[] = []
    for (let i = 0; i < 5 && path.length === 0; i++) {
      const target = walkable[Math.floor(Math.random() * walkable.length)]
      if (target.x === cur.x && target.y === cur.y) continue
      path = findPath(grid, cur, target)
    }
    return {
      ...emp,
      isMoving: false,
      path: path.map(tileCenter),
      waitTime: 1000 + Math.random() * 2500,
    }
  }

  const next = emp.path[0]
  const dx = next.x - emp.x
  const dy = next.y - emp.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const step = MOVE_SPEED * dt

  if (distance <= step) {
    return { ...emp, x: next.x, y: next.y, path: emp.path.slice(1), isMoving: true }
  }
  return {
    ...emp,
    x: emp.x + (dx / distance) * step,
    y: emp.y + (dy / distance) * step,
    direction: getDirection(dx, dy),
    isMoving: true,
  }
}

// ---------- 컴포넌트 ----------

export function OfficeView({ employees, selectedId, onSelect }: OfficeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const collisionGridRef = useRef<number[][]>([])
  const walkableRef = useRef<Point[]>([])
  const statesRef = useRef<EmployeeState[]>([])
  const layersRef = useRef<LayerCache[]>([])

  const mapReadyAtRef = useRef<number | null>(null)

  const [employeeStates, setEmployeeStates] = useState<EmployeeState[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showCollision, setShowCollision] = useState(false)
  const [loadErrors, setLoadErrors] = useState<string[]>([])

  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [mousePos, setMousePos] = useState<{
    tileX: number; tileY: number; px: number; py: number
  } | null>(null)

  // 1. TMX 로드 + 레이어 캐시 + 충돌 그리드 생성
  useEffect(() => {
    let cancelled = false

    async function loadAndRenderTmx() {
      try {
        const res = await fetch("/maps/map.tmx")
        if (!res.ok) throw new Error(`TMX 로드 실패 (Status: ${res.status})`)
        const xmlDoc = new DOMParser().parseFromString(await res.text(), "text/xml")

        const failed: string[] = []
        const tilesets = await loadTilesets(xmlDoc, failed)
        if (cancelled) return
        setLoadErrors([...new Set(failed)])

        // --- 충돌 그리드 ---
        const grid: number[][] = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(0))
        const layers = Array.from(xmlDoc.querySelectorAll("map > layer"))

        layers.forEach((layer) => {
          if (layer.getAttribute("name") !== "Collision") return
          const dataNode = layer.querySelector("data")
          if (!dataNode) return
          const gids = parseCsv(dataNode.textContent || "")
          for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
              const gid = ((gids[y * MAP_WIDTH + x] || 0) >>> 0) & GID_MASK
              if (gid > 0) grid[y][x] = 1
            }
          }
        })

        // 오브젝트 충돌: 실제 겹침 면적 기준
        Array.from(xmlDoc.querySelectorAll("map > objectgroup > object")).forEach((obj) => {
          const ox = parseFloat(obj.getAttribute("x") || "0")
          const oy = parseFloat(obj.getAttribute("y") || "0")
          const ow = parseFloat(obj.getAttribute("width") || "0")
          const oh = parseFloat(obj.getAttribute("height") || "0")
          if (ow <= 0 || oh <= 0) return

          const startX = Math.max(0, Math.floor(ox / TILE_SIZE))
          const endX = Math.min(MAP_WIDTH - 1, Math.floor((ox + ow) / TILE_SIZE))
          const startY = Math.max(0, Math.floor(oy / TILE_SIZE))
          const endY = Math.min(MAP_HEIGHT - 1, Math.floor((oy + oh) / TILE_SIZE))

          for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
              const overlapX = Math.min(ox + ow, (x + 1) * TILE_SIZE) - Math.max(ox, x * TILE_SIZE)
              const overlapY = Math.min(oy + oh, (y + 1) * TILE_SIZE) - Math.max(oy, y * TILE_SIZE)
              if (overlapX >= OBJECT_OVERLAP_MIN && overlapY >= OBJECT_OVERLAP_MIN) {
                grid[y][x] = 1
              }
            }
          }
        })

        collisionGridRef.current = grid
        walkableRef.current = findLargestWalkableRegion(grid)

        // --- 레이어별 캐시 생성 (정적 타일은 오프스크린에 1회, 애니메이션 타일은 목록으로) ---
        const caches: LayerCache[] = []

        layers.forEach((layer) => {
          if (layer.getAttribute("name") === "Collision") return
          if (layer.getAttribute("visible") === "0") return
          const dataNode = layer.querySelector("data")
          if (!dataNode) return

          const base = document.createElement("canvas")
          base.width = MAP_WIDTH * TILE_SIZE
          base.height = MAP_HEIGHT * TILE_SIZE
          const bctx = base.getContext("2d")
          if (!bctx) return
          bctx.imageSmoothingEnabled = false

          const animated: AnimatedTile[] = []
          const gids = parseCsv(dataNode.textContent || "")

          gids.forEach((rawGid, index) => {
            if (!rawGid) return
            const unsigned = rawGid >>> 0
            const gid = unsigned & GID_MASK
            if (gid === 0) return

            const ts = tilesets.find((t) => gid >= t.firstgid)
            if (!ts) return
            const localId = gid - ts.firstgid
            if (ts.tileCount > 0 && localId >= ts.tileCount) return

            const flags: Flags = {
              h: (unsigned & FLIP_H) !== 0,
              v: (unsigned & FLIP_V) !== 0,
              d: (unsigned & FLIP_D) !== 0,
            }
            const x = (index % MAP_WIDTH) * TILE_SIZE
            const y = Math.floor(index / MAP_WIDTH) * TILE_SIZE

            const anim = ts.animations.get(localId)
            if (anim) {
              animated.push({ x, y, ts, localId, flags, anim })
            } else {
              drawTile(bctx, ts, localId, flags, x, y)
            }
          })

          caches.push({ base, animated })
        })

        layersRef.current = caches

        // 최초 렌더
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = MAP_WIDTH * TILE_SIZE
        canvas.height = MAP_HEIGHT * TILE_SIZE
        renderMap(ctx, caches, performance.now())

        if (!cancelled) setMapLoaded(true)
      } catch (error) {
        console.error("[TMX Render Error]", error)
      }
    }

    loadAndRenderTmx()
    return () => { cancelled = true }
  }, [])

  // 충돌 영역 디버그 오버레이
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas || !mapLoaded) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!showCollision) return

    const grid = collisionGridRef.current
    ctx.fillStyle = "rgba(255, 0, 0, 0.35)"
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (grid[y][x] === 1) ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
  }, [showCollision, mapLoaded])

  const employeeIdsStr = useMemo(() => JSON.stringify(employees.map((e) => e.id)), [employees])

  // 2. 직원 스폰 / 제거
useEffect(() => {
  if (!mapLoaded) return
  const walkable = walkableRef.current
  if (walkable.length === 0) return

  // 맵이 준비된 시각을 최초 1회 기록
  if (mapReadyAtRef.current === null) mapReadyAtRef.current = performance.now()
  const isInitialLoad = performance.now() - mapReadyAtRef.current < INITIAL_LOAD_WINDOW_MS

  const currentIds = employees.map((e) => e.id)
  const next = statesRef.current.filter((s) => currentIds.includes(s.id))

  employees.forEach((emp) => {
    if (next.find((s) => s.id === emp.id)) return

    const pos = isInitialLoad
      ? tileCenter(walkable[Math.floor(Math.random() * walkable.length)])
      : getDoorSpawn(walkable)

    next.push({
      id: emp.id,
      x: pos.x,
      y: pos.y,
      path: [],
      waitTime: isInitialLoad ? Math.random() * 1200 : 300,
      direction: "down",
      isMoving: false,
    })
  })

  statesRef.current = next
  setEmployeeStates(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [employeeIdsStr, mapLoaded])


  // 3. 메인 루프: 타일 애니메이션 + 직원 이동 (requestAnimationFrame)
  useEffect(() => {
    if (!mapLoaded) return
    let raf = 0
    let last = performance.now()
    let lastSig = animSignature(layersRef.current, last)
    const hasAnim = layersRef.current.some((l) => l.animated.length > 0)

    const loop = (now: number) => {
      const dt = Math.min(now - last, 50) // 탭 전환 후 순간이동 방지
      last = now

      // 타일 애니메이션: 프레임이 바뀔 때만 다시 그림
      if (hasAnim) {
        const sig = animSignature(layersRef.current, now)
        if (sig !== lastSig) {
          lastSig = sig
          const ctx = canvasRef.current?.getContext("2d")
          if (ctx) renderMap(ctx, layersRef.current, now)
        }
      }

      // 직원 이동
      const grid = collisionGridRef.current
      if (grid.length && statesRef.current.length > 0) {
        const walkable = walkableRef.current
        const next = statesRef.current.map((s) => stepEmployee(s, grid, walkable, dt))
        statesRef.current = next
        setEmployeeStates(next)
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [mapLoaded])

  // 휠 줌 (정수 배율) + 컨테이너 크기 추적
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      setScale((prev) => Math.min(Math.max(MIN_SCALE, prev + (e.deltaY < 0 ? 1 : -1)), MAX_SCALE))
    }
    container.addEventListener("wheel", handleWheelNative, { passive: false })

    const updateSize = () => {
      const r = container.getBoundingClientRect()
      setContainerSize({ w: r.width, h: r.height })
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(container)

    return () => {
      container.removeEventListener("wheel", handleWheelNative)
      ro.disconnect()
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const rawX = (e.clientX - rect.left) / scale
      const rawY = (e.clientY - rect.top) / scale
      const tileX = Math.floor(rawX / TILE_SIZE)
      const tileY = Math.floor(rawY / TILE_SIZE)

      if (tileX >= 0 && tileY >= 0 && tileX < MAP_WIDTH && tileY < MAP_HEIGHT) {
        setMousePos({ tileX, tileY, px: Math.round(rawX), py: Math.round(rawY) })
      }
    }
  }

  // 맵을 정수 픽셀 위치에 고정 (flex 중앙 정렬의 0.5px 어긋남 방지)
  const mapPxW = MAP_WIDTH * TILE_SIZE
  const mapPxH = MAP_HEIGHT * TILE_SIZE
  const offsetX = Math.round((containerSize.w - mapPxW * scale) / 2 + position.x)
  const offsetY = Math.round((containerSize.h - mapPxH * scale) / 2 + position.y)

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ background: "var(--po-sky)" }}
      onMouseDown={(e) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {loadErrors.length > 0 && (
        <div
          className="absolute top-4 left-4 z-20 max-w-sm bg-red-900/90 text-white text-xs font-mono p-3 rounded-lg border border-red-500"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="font-bold mb-1">로드 실패 파일</div>
          {loadErrors.map((f) => <div key={f}>{f}</div>)}
        </div>
      )}

      <div
        className="absolute top-4 right-4 z-20 flex gap-3 bg-black/80 px-3 py-2 rounded-lg backdrop-blur text-white text-xs font-mono border border-gray-700 shadow-xl pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {mousePos && (
          <div className="flex items-center gap-2 text-[#5af78e] border-r border-gray-600 pr-3">
            <span>Tile: ({mousePos.tileX}, {mousePos.tileY})</span>
            <span className="text-gray-400 text-[11px]">PX: ({mousePos.px}, {mousePos.py})</span>
          </div>
        )}
        <label className="flex items-center gap-1 border-r border-gray-600 pr-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showCollision}
            onChange={(e) => setShowCollision(e.target.checked)}
          />
          <span>충돌 표시</span>
        </label>
        <div className="flex items-center gap-2">
          <span>배율: {scale}x</span>
          <button
            onClick={() => { setScale(DEFAULT_SCALE); setPosition({ x: 0, y: 0 }) }}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/40 rounded transition text-[11px]"
          >
            원래대로
          </button>
        </div>
      </div>

      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            background: "var(--po-ink)",
            width: `${mapPxW}px`,
            height: `${mapPxH}px`,
            imageRendering: "pixelated",
          }}
        >
          <canvas
            ref={canvasRef}
            width={mapPxW}
            height={mapPxH}
            className="block absolute top-0 left-0 z-0"
            style={{
              width: `${mapPxW}px`,
              height: `${mapPxH}px`,
              imageRendering: "pixelated",
            }}
          />

          {/* 충돌 디버그 오버레이 */}
          <canvas
            ref={overlayRef}
            width={mapPxW}
            height={mapPxH}
            className="block absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${mapPxW}px`,
              height: `${mapPxH}px`,
              imageRendering: "pixelated",
              zIndex: 5,
            }}
          />

          {/* 캐릭터 레이어 (Y축 기준 깊이 정렬) */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            {[...employeeStates]
              .sort((a, b) => a.y - b.y)
              .map((empState) => {
                const empInfo = employees.find((e) => e.id === empState.id)
                if (!empInfo) return null

                return (
                  <div
                    key={empState.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${Math.round(empState.x)}px`,
                      top: `${Math.round(empState.y)}px`,
                      transform: "translate(-50%, -100%)",
                      zIndex: Math.floor(empState.y),
                    }}
                  >
                    <PixelEmployee
                      employee={empInfo}
                      selected={selectedId === empState.id}
                      onSelect={onSelect}
                      direction={empState.direction}
                      isMoving={empState.isMoving}
                    />
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}