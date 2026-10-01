export type WorkStatus = "working" | "meeting" | "idle" | "break"

export const STATUS_META: Record<
  WorkStatus,
  { label: string; color: string; dot: string }
> = {
  working: { label: "작업 중", color: "var(--po-green)", dot: "#62c46a" },
  meeting: { label: "회의 중", color: "var(--po-blue)", dot: "#4f9fe6" },
  idle: { label: "대기 중", color: "var(--po-yellow)", dot: "#f2c94c" },
  break: { label: "휴식 중", color: "var(--po-gray)", dot: "#9a8fa6" },
}

export type DepartmentId =
  | "finance"
  | "legal"
  | "hr"
  | "ops"
  | "design"
  | "marketing"
  | "support"
  | "sales"

export interface Department {
  id: DepartmentId
  name: string
  /** wall / accent color for the room */
  wall: string
  floor: string
  /** side of the building */
  side: "left" | "right"
  order: number
}

export const DEPARTMENTS: Department[] = [
  { id: "finance", name: "재무부", wall: "#4a7c8c", floor: "#c69a5f", side: "left", order: 0 },
  { id: "legal", name: "법무부", wall: "#7a5a8c", floor: "#b98d55", side: "right", order: 0 },
  { id: "hr", name: "인사부", wall: "#5a8c6a", floor: "#cf9f66", side: "left", order: 1 },
  { id: "ops", name: "경영지원부", wall: "#8c7a4a", floor: "#c1935a", side: "right", order: 1 },
  { id: "design", name: "디자인팀", wall: "#8c5a6a", floor: "#c69a5f", side: "left", order: 2 },
  { id: "marketing", name: "마케팅부", wall: "#4a6a8c", floor: "#b98d55", side: "right", order: 2 },
  { id: "support", name: "고객지원부", wall: "#5a7a8c", floor: "#cf9f66", side: "left", order: 3 },
  { id: "sales", name: "영업부", wall: "#6a8c4a", floor: "#c1935a", side: "right", order: 3 },
]

export interface Employee {
  id: string
  name: string
  role: string
  dept: DepartmentId
  /** shirt color */
  shirt: string
  hair: string
  skin: string
  status: WorkStatus
  task: string
  /** 0-100 stats */
  autonomy: number
  judgement: number
  completion: number
}

export interface Task {
  id: string
  title: string
  dept: DepartmentId
  assignee: string
  progress: number
  state: "queued" | "active" | "done"
  priority: "낮음" | "보통" | "높음"
}

const SKINS = ["#f2c9a0", "#e0aa79", "#c98b5e", "#8a5a3a"]
const HAIRS = ["#2c2038", "#5a3a24", "#8c5a2a", "#3a3a44", "#6a3060"]

function mk(
  id: string,
  name: string,
  role: string,
  dept: DepartmentId,
  status: WorkStatus,
  task: string,
  stats: [number, number, number],
  look: [number, number, string],
): Employee {
  return {
    id,
    name,
    role,
    dept,
    status,
    task,
    autonomy: stats[0],
    judgement: stats[1],
    completion: stats[2],
    skin: SKINS[look[0]],
    hair: HAIRS[look[1]],
    shirt: look[2],
  }
}

export const EMPLOYEES: Employee[] = [
  // 재무부
  mk("f1", "정하늘", "재무 분석 AI", "finance", "working", "3분기 손익 리포트 정리", [72, 88, 91], [0, 0, "#3f6f7d"]),
  mk("f2", "김도윤", "회계 AI", "finance", "working", "거래내역 대사 처리", [64, 79, 85], [1, 1, "#4a7c8c"]),
  mk("f3", "이서준", "예산 AI", "finance", "idle", "다음 작업 대기", [55, 70, 74], [2, 2, "#356070"]),
  // 법무부
  mk("l1", "박변호", "법률 검토 AI", "legal", "working", "공급 계약서 조항 검토", [81, 93, 88], [3, 0, "#6a4a7c"]),
  mk("l2", "최규현", "계약 관리 AI", "legal", "meeting", "리스크 검토 회의", [70, 85, 80], [1, 4, "#7a5a8c"]),
  // 인사부
  mk("h1", "한지원", "채용 AI", "hr", "working", "지원자 이력서 스크리닝", [76, 82, 90], [0, 4, "#4f7c5f"]),
  mk("h2", "오세라", "인사 운영 AI", "hr", "break", "잠시 휴식", [60, 74, 78], [1, 0, "#5a8c6a"]),
  mk("h3", "장민석", "복지 담당 AI", "hr", "idle", "다음 작업 대기", [58, 66, 72], [2, 1, "#3f6f4f"]),
  // 경영지원부
  mk("o1", "윤태호", "조직 관리 AI", "ops", "working", "조직도 업데이트", [69, 80, 84], [1, 2, "#7c6a3a"]),
  mk("o2", "신아름", "총무 AI", "ops", "working", "자산 대장 점검", [63, 75, 81], [0, 3, "#8c7a4a"]),
]

export const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "3분기 손익 리포트 정리", dept: "finance", assignee: "f1", progress: 62, state: "active", priority: "높음" },
  { id: "t2", title: "공급 계약서 조항 검토", dept: "legal", assignee: "l1", progress: 40, state: "active", priority: "높음" },
  { id: "t3", title: "지원자 이력서 스크리닝", dept: "hr", assignee: "h1", progress: 78, state: "active", priority: "보통" },
  { id: "t4", title: "신규 화면 목업 제작", dept: "design", assignee: "d1", progress: 55, state: "active", priority: "보통" },
  { id: "t5", title: "Q4 캠페인 전략 수립", dept: "marketing", assignee: "m1", progress: 33, state: "active", priority: "높음" },
  { id: "t6", title: "티켓 #4821 응대", dept: "support", assignee: "s1", progress: 90, state: "active", priority: "보통" },
  { id: "t7", title: "리드 파이프라인 분석", dept: "sales", assignee: "e1", progress: 48, state: "active", priority: "보통" },
  { id: "t8", title: "조직도 업데이트", dept: "ops", assignee: "o1", progress: 100, state: "done", priority: "낮음" },
  { id: "t9", title: "SNS 카피 24종 생성", dept: "marketing", assignee: "m2", progress: 100, state: "done", priority: "낮음" },
  { id: "t10", title: "브랜드 가이드 리뉴얼", dept: "design", assignee: "", progress: 0, state: "queued", priority: "보통" },
  { id: "t11", title: "연말 정산 준비", dept: "finance", assignee: "", progress: 0, state: "queued", priority: "높음" },
]
