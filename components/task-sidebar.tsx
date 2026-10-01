"use client"

import { useMemo, useState } from "react"
import { StatBar } from "@/components/stat-bar"
import {
  DEPARTMENTS,
  STATUS_META,
  type Employee,
  type Task,
} from "@/lib/office-data"

const deptName = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.name ?? ""
const deptWall = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.wall ?? "#555"

const DEFAULT_ROLES = [
  "시니어 개발자",
  "백엔드 개발자",
  "프론트엔드 개발자",
  "UI/UX 디자이너",
  "마케팅 매니저",
  "인사 담당자",
]

type Filter = "all" | "active" | "queued" | "done"

const STATE_LABEL: Record<Task["state"], string> = {
  active: "진행중",
  queued: "대기",
  done: "완료",
}

const STATE_COLOR: Record<Task["state"], string> = {
  done: "var(--po-mint)",
  active: "var(--po-peach)",
  queued: "var(--po-lilac)",
}

function EmployeeDetail({
  employee,
  onStatus,
  onEdit,
  onDelete,
}: {
  employee: Employee
  onStatus: (id: string, status: Employee["status"]) => void
  onEdit: (employee: Employee) => void
  onDelete?: (id: string) => void
}) {
  // STATUS_META 에러 방지용 기본값 처리
  const meta = STATUS_META[employee.status] ?? {
    label: employee.status || "대기 중",
    color: "var(--po-mint)",
  }

  return (
    <div className="pixel-soft overflow-hidden" style={{ background: "var(--po-panel-light)" }}>
      {/* 프로필 클릭 시 수정 모달 오픈 */}
      <div
        onClick={() => onEdit(employee)}
        className="flex cursor-pointer items-center gap-3 p-3 transition-opacity hover:opacity-90"
        style={{ background: "var(--po-panel-light-2)" }}
        title="클릭하여 직원 정보 수정"
      >
        {/* avatar */}
        <div
          className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-end overflow-hidden pixel-soft"
          style={{ background: deptWall(employee.dept) }}
          aria-hidden
        >
          <div className="po-scanlines absolute inset-0" />
          <div className="relative h-[7px] w-[24px]" style={{ background: employee.hair }} />
          <div className="relative flex h-[15px] w-[24px] items-center justify-center gap-[5px]" style={{ background: employee.skin }}>
            <span className="h-[3px] w-[3px]" style={{ background: "var(--po-ink)" }} />
            <span className="h-[3px] w-[3px]" style={{ background: "var(--po-ink)" }} />
          </div>
          <div className="relative h-[18px] w-[34px]" style={{ background: employee.shirt }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-pixel truncate text-[13px]" style={{ color: "var(--po-ink2)" }}>
            {employee.name} ✏️
          </p>
          <p className="font-pixel-sm truncate text-[10px]" style={{ color: "var(--po-ink2-soft)" }}>
            {deptName(employee.dept)} · {employee.role}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className="po-sheen-soft font-pixel-sm inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] pixel-soft-sm"
              style={{ background: meta.color, color: "var(--po-ink2)" }}
            >
              <span className="po-status-live h-1.5 w-1.5" style={{ background: "var(--po-ink2)", borderRadius: 999 }} />
              {meta.label}
            </span>

            {/* 삭제 버튼 */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation() // 수정 모달 팝업 방지
                  if (confirm(`${employee.name} 직원을 정말 삭제하시겠습니까?`)) {
                    onDelete(employee.id)
                  }
                }}
                className="btn-delete-emp font-pixel-sm px-1.5 py-0.5 text-[10px] pixel-soft-sm transition-transform active:translate-y-[1px]"
                title="직원 삭제"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {/* current task */}
      <div className="mx-3 mt-3 mb-1 px-2 py-1.5 pixel-soft-in" style={{ background: "#fff4e2" }}>
        <p className="font-pixel-sm text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>
          현재 작업
        </p>
        <p className="font-pixel-sm text-[11px]" style={{ color: "var(--po-ink2)" }}>
          {employee.task}
        </p>
      </div>

      {/* stats */}
      <div className="flex flex-col gap-1.5 p-3 pt-2">
        <StatBar label="자율성" value={employee.autonomy} />
        <StatBar label="판단력" value={employee.judgement} />
        <StatBar label="완결성" value={employee.completion} />
      </div>

      {/* actions */}
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
        <ActionBtn label="작업 지시" color="var(--po-mint)" onClick={() => onStatus(employee.id, "working")} />
        <ActionBtn label="회의 소집" color="var(--po-sky2)" onClick={() => onStatus(employee.id, "meeting")} />
        <ActionBtn label="휴식" color="var(--po-lilac)" onClick={() => onStatus(employee.id, "break")} />
      </div>
    </div>
  )
}

function ActionBtn({
  label,
  color,
  onClick,
}: {
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="po-sheen-soft font-pixel-sm px-1 py-1.5 text-[10px] pixel-soft-sm transition-transform active:translate-y-[2px]"
      style={{ background: color, color: "var(--po-ink2)" }}
    >
      {label}
    </button>
  )
}

function TaskRow({
  task,
  onClick,
}: {
  task: Task
  onClick: () => void
}) {
  const stateColor = STATE_COLOR[task.state]
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1.5 p-2 text-left pixel-soft transition-transform hover:-translate-y-[1px]"
      style={{ background: "var(--po-panel-light)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-pixel-sm text-[11px] leading-tight" style={{ color: "var(--po-ink2)" }}>
          {task.title}
        </span>
        <span
          className="po-sheen-soft font-pixel-sm shrink-0 px-1 py-0.5 text-[9px] pixel-soft-sm"
          style={{ background: stateColor, color: "var(--po-ink2)" }}
        >
          {STATE_LABEL[task.state]}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className="font-pixel-sm px-1 py-0.5 text-[9px] pixel-soft-sm"
          style={{ background: deptWall(task.dept), color: "#fff" }}
        >
          {deptName(task.dept)}
        </span>
        <span className="font-pixel-sm text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>
          우선도 {task.priority}
        </span>
      </div>
      {/* progress */}
      <div className="relative h-3 w-full pixel-soft-in" style={{ background: "#fff4e2" }}>
        <div
          className="h-full"
          style={{
            width: `${task.progress}%`,
            background: stateColor,
            borderRadius: 5,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.12)",
            transition: "width 0.4s steps(6)",
          }}
        />
      </div>
    </button>
  )
}

export function TaskSidebar({
  employee,
  employees = [],
  roles = DEFAULT_ROLES,
  tasks,
  onStatus,
  onAddTask,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onFocusAssignee,
}: {
  employee: Employee | null
  employees?: Employee[]
  roles?: string[]
  tasks: Task[]
  onStatus: (id: string, status: Employee["status"]) => void
  onAddTask: (title?: string, priority?: number, assigneeId?: string) => void
  onAddEmployee?: (newEmployee: Omit<Employee, "id">) => void
  onUpdateEmployee?: (updatedEmployee: Partial<Employee> & { id: string }) => void
  onDeleteEmployee?: (id: string) => void
  onFocusAssignee: (assignee: string) => void
}) {
  const [filter, setFilter] = useState<Filter>("all")

  // 작업 추가 모달 State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState(1)
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("")

  // 작업 상세보기 모달 State
  const [viewingTask, setViewingTask] = useState<Task | null>(null)

  // 직원 목록 및 수정 모달 State
  const [isEmpListOpen, setIsEmpListOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editDept, setEditDept] = useState<Employee["dept"]>(DEPARTMENTS[0]?.id as Employee["dept"])

  // 직원 추가 모달 State
  const activeRoles = roles.length > 0 ? roles : DEFAULT_ROLES
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addRole, setAddRole] = useState(activeRoles[0] || "")
  const [addDept, setAddDept] = useState<Employee["dept"]>(DEPARTMENTS[0]?.id as Employee["dept"])
  const [addHair, setAddHair] = useState("#333333")
  const [addSkin, setAddSkin] = useState("#ffdbac")
  const [addShirt, setAddShirt] = useState("#4a90e2")

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    onAddTask(newTaskTitle, newTaskPriority, newTaskAssignee || undefined)
    setIsTaskModalOpen(false)
    setNewTaskTitle("")
    setNewTaskPriority(1)
    setNewTaskAssignee("")
  }

  const handleOpenEditEmp = (emp: Employee) => {
    setEditingEmployee(emp)
    setEditName(emp.name)
    setEditRole(emp.role)
    setEditDept(emp.dept)
  }

  const handleSaveEmployee = () => {
    if (!editingEmployee) return
    if (onUpdateEmployee) {
      onUpdateEmployee({
        id: editingEmployee.id,
        name: editName,
        role: editRole,
        dept: editDept,
      })
    }
    setEditingEmployee(null)
  }

  const handleCreateEmployee = () => {
    if (!addName.trim()) return
    if (onAddEmployee) {
      onAddEmployee({
        name: addName,
        role: addRole || activeRoles[0] || "팀원",
        dept: addDept,
        status: "working",
        task: "업무 대기 중",
        autonomy: 50,
        judgement: 50,
        completion: 50,
        hair: addHair,
        skin: addSkin,
        shirt: addShirt,
      })
    }
    setIsAddEmpModalOpen(false)
    setAddName("")
  }

  const handleTaskClick = (task: Task) => {
    setViewingTask(task)
    if (task.assignee) {
      onFocusAssignee(task.assignee)
    }
  }

  const selectedNewAssigneeEmp = useMemo(() => {
    if (!newTaskAssignee) return null
    return employees.find((e) => e.id === newTaskAssignee) ?? null
  }, [newTaskAssignee, employees])

  const assignedEmployee = useMemo(() => {
    if (!viewingTask || !viewingTask.assignee) return null
    return employees.find((e) => e.id === viewingTask.assignee) ?? null
  }, [viewingTask, employees])

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((t) => t.state === "active").length,
      queued: tasks.filter((t) => t.state === "queued").length,
      done: tasks.filter((t) => t.state === "done").length,
    }),
    [tasks],
  )

  const shown = filter === "all" ? tasks : tasks.filter((t) => t.state === filter)

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "active", label: "진행중" },
    { id: "queued", label: "대기" },
    { id: "done", label: "완료" },
  ]

  return (
    <>
      <aside
        className="flex w-[340px] shrink-0 flex-col gap-3 overflow-y-auto po-scroll p-3"
        style={{ background: "var(--po-cream-bg)", borderLeft: "3px solid var(--po-line)" }}
      >
        {/* selected employee */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>직원 상세</SectionTitle>
            
            <button
              type="button"
              onClick={() => setIsEmpListOpen(!isEmpListOpen)}
              className="po-sheen-soft font-pixel-sm px-2 py-1 text-[11px] pixel-soft-sm transition-transform active:translate-y-[1px]"
              style={{ background: "var(--po-panel-light)", color: "var(--po-ink2)" }}
              title="직원 목록 보기"
            >
              ☰ 목록
            </button>
          </div>
          
          {/* 직원 목록 레이어 */}
          {isEmpListOpen && (
            <div
              className="mb-3 p-2 pixel-soft flex flex-col gap-1.5 max-h-[200px] overflow-y-auto po-scroll"
              style={{ background: "var(--po-panel-light-2)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-pixel-sm text-[10px]" style={{ color: "var(--po-ink2-soft)" }}>
                  직원 목록 ({employees.length}명)
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddEmpModalOpen(true)}
                  className="po-sheen-soft font-pixel-sm px-1.5 py-0.5 text-[9px] pixel-soft-sm active:translate-y-[1px]"
                  style={{ background: "var(--po-mint)", color: "var(--po-ink2)" }}
                >
                  + 직원 추가
                </button>
              </div>

              {employees.length > 0 ? (
                employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleOpenEditEmp(emp)}
                    className="flex items-center justify-between p-1.5 text-left pixel-soft-sm transition-transform hover:translate-x-1"
                    style={{ background: "var(--po-panel-light)" }}
                  >
                    <span className="font-pixel-sm text-[11px]" style={{ color: "var(--po-ink2)" }}>
                      {emp.name} <span className="text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>({emp.role})</span>
                    </span>
                    <span
                      className="font-pixel-sm px-1 text-[9px] pixel-soft-sm"
                      style={{ background: deptWall(emp.dept), color: "#fff" }}
                    >
                      {deptName(emp.dept)}
                    </span>
                  </button>
                ))
              ) : (
                <p className="font-pixel-sm text-[10px] text-center py-2" style={{ color: "var(--po-ink2-soft)" }}>
                  등록된 직원이 없습니다.
                </p>
              )}
            </div>
          )}

          {employee ? (
            <EmployeeDetail employee={employee} onStatus={onStatus} onEdit={handleOpenEditEmp} onDelete={onDeleteEmployee} />
          ) : (
            <div
              className="font-pixel-sm p-4 text-center text-[11px] pixel-soft-in"
              style={{ background: "var(--po-panel-light)", color: "var(--po-ink2-soft)" }}
            >
              뷰에서 직원을 선택하면
              <br />
              상태와 능력치가 표시됩니다.
            </div>
          )}
        </div>

        {/* task management */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between">
            <SectionTitle>작업 관리</SectionTitle>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="po-sheen-soft font-pixel-sm px-2 py-1 text-[10px] pixel-soft-sm transition-transform active:translate-y-[2px]"
              style={{ background: "var(--po-peach)", color: "var(--po-ink2)" }}
            >
              + 새 작업
            </button>
          </div>

          {/* filter tabs */}
          <div className="mb-2 grid grid-cols-4 gap-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={
                  "font-pixel-sm px-1 py-1 text-[10px] " +
                  (filter === f.id ? "po-sheen-soft pixel-soft-sm" : "pixel-soft-in")
                }
                style={{
                  background: filter === f.id ? "var(--po-lemon)" : "var(--po-panel-light)",
                  color: "var(--po-ink2)",
                }}
              >
                {f.label} {counts[f.id]}
              </button>
            ))}
          </div>

          {/* task list */}
          <div className="flex flex-col gap-2">
            {shown.map((t) => (
              <TaskRow key={t.id} task={t} onClick={() => handleTaskClick(t)} />
            ))}
            {shown.length === 0 && (
              <p className="font-pixel-sm py-4 text-center text-[10px]" style={{ color: "var(--po-ink2-soft)" }}>
                해당 작업이 없습니다.
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* 1. 새 작업 추가 모달 */}
      {isTaskModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsTaskModalOpen(false)}
        >
          <div
            className="w-[340px] p-4 pixel-soft shadow-xl"
            style={{ background: "var(--po-panel-light)", border: "2px solid var(--po-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-pixel text-[13px] mb-3" style={{ color: "var(--po-ink2)" }}>
              새 작업 추가
            </h2>

            <div className="flex flex-col gap-2.5 mb-4">
              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  작업 이름
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="작업 내용 입력"
                  className="w-full font-pixel-sm px-2 py-1.5 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                />
              </div>

              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  담당 직원 지정
                </label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full font-pixel-sm px-2 py-1.5 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                >
                  <option value="">미지정 (대기열)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({deptName(emp.dept)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedNewAssigneeEmp && (
                <div className="flex items-center gap-3 p-2 pixel-soft-in" style={{ background: "#fff4e2" }}>
                  <div
                    className="relative flex h-10 w-10 shrink-0 flex-col items-center justify-end overflow-hidden pixel-soft"
                    style={{ background: deptWall(selectedNewAssigneeEmp.dept) }}
                  >
                    <div className="relative h-[4px] w-[14px]" style={{ background: selectedNewAssigneeEmp.hair }} />
                    <div className="relative flex h-[9px] w-[14px] items-center justify-center gap-[2px]" style={{ background: selectedNewAssigneeEmp.skin }}>
                      <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                      <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                    </div>
                    <div className="relative h-[11px] w-[20px]" style={{ background: selectedNewAssigneeEmp.shirt }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-pixel truncate text-[11px]" style={{ color: "var(--po-ink2)" }}>
                      {selectedNewAssigneeEmp.name}
                    </p>
                    <p className="font-pixel-sm truncate text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>
                      {deptName(selectedNewAssigneeEmp.dept)} · {selectedNewAssigneeEmp.role}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  우선도
                </label>
                <input
                  type="number"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(Number(e.target.value))}
                  className="w-full font-pixel-sm px-2 py-1.5 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="po-sheen-soft font-pixel-sm px-3 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-lilac)", color: "var(--po-ink2)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddTask}
                className="po-sheen-soft font-pixel-sm px-3 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-peach)", color: "var(--po-ink2)" }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 작업 상세보기 및 직원 변경 모달 */}
      {viewingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setViewingTask(null)}
        >
          <div
            className="w-[340px] p-4 pixel-soft shadow-xl"
            style={{ background: "var(--po-panel-light)", border: "2px solid var(--po-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 border-b-2 pb-2" style={{ borderColor: "var(--po-line)" }}>
              <h2 className="font-pixel text-[13px]" style={{ color: "var(--po-ink2)" }}>
                📋 작업 상세 정보
              </h2>
              <span
                className="po-sheen-soft font-pixel-sm px-1.5 py-0.5 text-[9px] pixel-soft-sm"
                style={{ background: STATE_COLOR[viewingTask.state], color: "var(--po-ink2)" }}
              >
                {STATE_LABEL[viewingTask.state]}
              </span>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="p-2.5 pixel-soft-in" style={{ background: "#fff" }}>
                <span className="font-pixel-sm text-[9px] block mb-0.5" style={{ color: "var(--po-ink2-soft)" }}>
                  작업 내용
                </span>
                <p className="font-pixel text-[12px]" style={{ color: "var(--po-ink2)" }}>
                  {viewingTask.title}
                </p>
              </div>

              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  담당 직원 변경
                </label>
                <select
                  value={viewingTask.assignee || ""}
                  onChange={(e) => {
                    const nextAssignee = e.target.value
                    setViewingTask((prev) => (prev ? { ...prev, assignee: nextAssignee } : null))
                    if (nextAssignee) {
                      onFocusAssignee(nextAssignee)
                    }
                  }}
                  className="w-full font-pixel-sm px-2 py-1.5 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                >
                  <option value="">미지정 (대기열)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({deptName(emp.dept)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 pixel-soft-in flex items-center gap-3" style={{ background: "#fff4e2" }}>
                {assignedEmployee ? (
                  <>
                    <div
                      className="relative flex h-12 w-12 shrink-0 flex-col items-center justify-end overflow-hidden pixel-soft"
                      style={{ background: deptWall(assignedEmployee.dept) }}
                    >
                      <div className="relative h-[5px] w-[18px]" style={{ background: assignedEmployee.hair }} />
                      <div className="relative flex h-[11px] w-[18px] items-center justify-center gap-[3px]" style={{ background: assignedEmployee.skin }}>
                        <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                        <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                      </div>
                      <div className="relative h-[13px] w-[26px]" style={{ background: assignedEmployee.shirt }} />
                    </div>
                    <div>
                      <span className="font-pixel-sm text-[9px] block" style={{ color: "var(--po-ink2-soft)" }}>
                        현재 담당자
                      </span>
                      <p className="font-pixel text-[11px]" style={{ color: "var(--po-ink2)" }}>
                        {assignedEmployee.name} <span className="font-pixel-sm text-[9px]">({assignedEmployee.role})</span>
                      </p>
                      <span
                        className="font-pixel-sm px-1 py-0.5 text-[8px] pixel-soft-sm inline-block mt-0.5"
                        style={{ background: deptWall(assignedEmployee.dept), color: "#fff" }}
                      >
                        {deptName(assignedEmployee.dept)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="font-pixel-sm text-[9px] block" style={{ color: "var(--po-ink2-soft)" }}>
                      현재 담당자
                    </span>
                    <p className="font-pixel text-[11px]" style={{ color: "var(--po-coral)" }}>
                      담당 직원이 배정되지 않았습니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-2.5 pixel-soft-in flex flex-col gap-1.5" style={{ background: "#fff" }}>
                <div className="flex justify-between items-center">
                  <span className="font-pixel-sm text-[10px]" style={{ color: "var(--po-ink2)" }}>
                    진행도 (Gauge)
                  </span>
                  <span className="font-pixel text-[11px]" style={{ color: "var(--po-ink2)" }}>
                    {viewingTask.progress}%
                  </span>
                </div>
                <div className="relative h-4 w-full pixel-soft-in" style={{ background: "#eee" }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${viewingTask.progress}%`,
                      background: STATE_COLOR[viewingTask.state],
                      borderRadius: 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.12)",
                      transition: "width 0.4s steps(10)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t-2" style={{ borderColor: "var(--po-line)" }}>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="po-sheen-soft font-pixel-sm px-4 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-mint)", color: "var(--po-ink2)" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 3. 직원 정보 수정 모달 (역할/직급 드롭다운 적용) */}
      {editingEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setEditingEmployee(null)}
        >
          <div
            className="w-[320px] p-4 pixel-soft shadow-xl"
            style={{ background: "var(--po-panel-light)", border: "2px solid var(--po-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-pixel text-[13px] mb-3" style={{ color: "var(--po-ink2)" }}>
              직원 정보 수정
            </h2>

            <div className="flex items-center gap-3 p-2.5 mb-3 pixel-soft-in" style={{ background: "#fff4e2" }}>
              <div
                className="relative flex h-12 w-12 shrink-0 flex-col items-center justify-end overflow-hidden pixel-soft"
                style={{ background: deptWall(editDept) }}
              >
                <div className="relative h-[5px] w-[18px]" style={{ background: editingEmployee.hair }} />
                <div className="relative flex h-[11px] w-[18px] items-center justify-center gap-[3px]" style={{ background: editingEmployee.skin }}>
                  <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                  <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                </div>
                <div className="relative h-[13px] w-[26px]" style={{ background: editingEmployee.shirt }} />
              </div>
              <div>
                <p className="font-pixel text-[11px]" style={{ color: "var(--po-ink2)" }}>
                  {editingEmployee.name}
                </p>
<p className="font-pixel-sm text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>
  상태: {STATUS_META[editingEmployee.status]?.label ?? editingEmployee.status ?? "대기 중"}
</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 mb-4">
              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  이름
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full font-pixel-sm px-2 py-1.5 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                />
              </div>

              {/* 🎯 역할 / 직급 선택 드롭다운 */}
              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  역할 / 직급
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full font-pixel-sm px-2 py-1.5 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                >
                  {activeRoles.map((r, idx) => (
                    <option key={idx} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  부서
                </label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value as Employee["dept"])}
                  className="w-full font-pixel-sm px-2 py-1.5 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="po-sheen-soft font-pixel-sm px-3 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-lilac)", color: "var(--po-ink2)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEmployee}
                className="po-sheen-soft font-pixel-sm px-3 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-mint)", color: "var(--po-ink2)" }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 4. 새 직원 추가 모달 (역할/직급 드롭다운 적용) */}
      {isAddEmpModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsAddEmpModalOpen(false)}
        >
          <div
            className="w-[320px] p-4 pixel-soft shadow-xl"
            style={{ background: "var(--po-panel-light)", border: "2px solid var(--po-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-pixel text-[13px] mb-3" style={{ color: "var(--po-ink2)" }}>
              새 직원 추가
            </h2>

            <div className="flex items-center gap-3 p-2.5 mb-3 pixel-soft-in justify-center" style={{ background: "#fff4e2" }}>
              <div
                className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-end overflow-hidden pixel-soft"
                style={{ background: deptWall(addDept) }}
              >
                <div className="relative h-[6px] w-[20px]" style={{ background: addHair }} />
                <div className="relative flex h-[13px] w-[20px] items-center justify-center gap-[4px]" style={{ background: addSkin }}>
                  <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                  <span className="h-[2px] w-[2px]" style={{ background: "var(--po-ink)" }} />
                </div>
                <div className="relative h-[15px] w-[28px]" style={{ background: addShirt }} />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  이름
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full font-pixel-sm px-2 py-1 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                />
              </div>

              {/* 🎯 역할 / 직급 선택 드롭다운 */}
              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  역할 / 직급
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full font-pixel-sm px-2 py-1 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                >
                  {activeRoles.map((r, idx) => (
                    <option key={idx} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-pixel-sm block mb-1 text-[10px]" style={{ color: "var(--po-ink2)" }}>
                  부서
                </label>
                <select
                  value={addDept}
                  onChange={(e) => setAddDept(e.target.value as Employee["dept"])}
                  className="w-full font-pixel-sm px-2 py-1 text-[11px] pixel-soft-in outline-none"
                  style={{ background: "#fff", color: "var(--po-ink2)" }}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                  <label className="font-pixel-sm block text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>머리색</label>
                  <input type="color" value={addHair} onChange={(e) => setAddHair(e.target.value)} className="w-full h-6 cursor-pointer" />
                </div>
                <div>
                  <label className="font-pixel-sm block text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>피부색</label>
                  <input type="color" value={addSkin} onChange={(e) => setAddSkin(e.target.value)} className="w-full h-6 cursor-pointer" />
                </div>
                <div>
                  <label className="font-pixel-sm block text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>옷색상</label>
                  <input type="color" value={addShirt} onChange={(e) => setAddShirt(e.target.value)} className="w-full h-6 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddEmpModalOpen(false)}
                className="po-sheen-soft font-pixel-sm px-3 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-lilac)", color: "var(--po-ink2)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateEmployee}
                className="po-sheen-soft font-pixel-sm px-3 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-mint)", color: "var(--po-ink2)" }}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2">
      <span className="h-3 w-3 pixel-soft-sm" style={{ background: "var(--po-peach)" }} aria-hidden />
      <span className="font-pixel text-[12px]" style={{ color: "var(--po-ink2)" }}>
        {children}
      </span>
    </h2>
  )
}