"use client"

import { useEffect, useMemo, useState } from "react"
import { OfficeView } from "@/components/office-view"
import { TaskSidebar } from "@/components/task-sidebar"
import { TopBar } from "@/components/top-bar"
import { DebugConsole } from "@/components/debug"
import { AdminView } from "@/components/admin"
import {
  DEPARTMENTS,
  type DepartmentId,
  type Employee,
  type Task,
  type WorkStatus,
} from "@/lib/office-data"

const NEW_TASK_POOL = [
  "경쟁사 리포트 요약",
  "월간 KPI 대시보드 갱신",
  "신규 정책 초안 작성",
  "고객 만족도 설문 분석",
  "제품 출시 체크리스트 점검",
  "예산 재배분 시뮬레이션",
  "온보딩 문서 업데이트",
  "리텐션 캠페인 기획",
]

export function OfficeApp() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [running, setRunning] = useState(true)

  // 오피스 맵("map")과 관리자 화면("admin")을 전환하는 State
  const [currentView, setCurrentView] = useState<"map" | "admin">("map")

  // 디버그 모드 열림/닫힘 상태
  const [isDebugOpen, setIsDebugOpen] = useState(false)

  // 1. [GET] 직원 목록 불러오기
  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployees(data)
          if (data.length > 0) {
            setSelectedId(data[0].id)
          }
        }
      })
      .catch((err) => console.error("직원 목록 로드 실패:", err))
  }, [])

  // 2. [GET] DB에서 Task 목록 불러오기
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setTasks(data)
        }
      }
    } catch (err) {
      console.error("작업 목록 로드 실패:", err)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // 3. [POST] 신규 직원 추가
  const handleAddEmployee = async (newEmp: Omit<Employee, "id">) => {
    const createdEmployee: Employee = {
      ...newEmp,
      id: `emp_${Date.now()}`,
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createdEmployee),
      })

      if (res.ok) {
        setEmployees((prev) => [...prev, createdEmployee])
        setSelectedId(createdEmployee.id)
      } else {
        console.error("직원 추가 실패")
      }
    } catch (error) {
      console.error("직원 추가 중 오류 발생:", error)
    }
  }

  // 4. [PUT] 직원 정보 수정
  const handleUpdateEmployee = async (updatedData: Partial<Employee> & { id: string }) => {
    try {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (res.ok) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === updatedData.id ? { ...e, ...updatedData } : e))
        )
      } else {
        console.error("직원 수정 실패")
      }
    } catch (error) {
      console.error("직원 수정 중 오류 발생:", error)
    }
  }

  // 5. [DELETE] 직원 삭제
  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id))
        if (selectedId === id) setSelectedId(null)
      } else {
        console.error("직원 삭제 실패")
      }
    } catch (error) {
      console.error("직원 삭제 중 오류 발생:", error)
    }
  }

  // 직원 상태 변경시
  const handleStatus = (id: string, status: WorkStatus) => {
    handleUpdateEmployee({ id, status })
  }

  // 6. [POST] 신규 Task 추가 (DB 연동)
  const handleAddTask = async (title?: string, priorityNum?: number) => {
    const dept = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)].id as DepartmentId
    const taskTitle = title && title.trim() ? title : NEW_TASK_POOL[Math.floor(Math.random() * NEW_TASK_POOL.length)]

    let priorityLabel: Task["priority"] = "보통"
    if (priorityNum === 1) priorityLabel = "낮음"
    else if (priorityNum === 2) priorityLabel = "보통"
    else if (priorityNum && priorityNum >= 3) priorityLabel = "높음"

    const newTask: Task = {
      id: `t${Date.now()}`,
      title: taskTitle,
      dept,
      assignee: "",
      progress: 0,
      state: "queued",
      priority: priorityLabel,
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      })

      if (res.ok) {
        setTasks((prev) => [newTask, ...prev])
      } else {
        console.error("Task 추가 실패")
      }
    } catch (error) {
      console.error("Task 추가 중 오류 발생:", error)
    }
  }

  // 7. [PUT] Task 상태/진행률 수정 (DB 연동)
  const handleUpdateTask = async (updatedData: Partial<Task> & { id: string }) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedData.id ? { ...t, ...updatedData } : t))
        )
      }
    } catch (error) {
      console.error("Task 수정 중 오류 발생:", error)
    }
  }

  // 라이브 시뮬레이션 타이머
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      // 태스크 진행률 증가
      setTasks((prev) =>
        prev.map((t) => {
          if (t.state !== "active") return t
          const next = Math.min(100, t.progress + Math.floor(Math.random() * 6))
          const updatedState = next >= 100 ? ("done" as const) : t.state

          // 진행률이 100%가 되었을 때 DB 수정 호출
          if (next >= 100 && t.progress < 100) {
            handleUpdateTask({ id: t.id, progress: 100, state: "done" })
          }

          return { ...t, progress: next, state: updatedState }
        }),
      )

      // 직원 상태 미세 변경
      setEmployees((prev) => {
        if (prev.length === 0) return prev
        const i = Math.floor(Math.random() * prev.length)
        return prev.map((e, idx) => {
          if (idx !== i) return e
          const roll = Math.random()
          let status: WorkStatus = e.status
          if (roll < 0.15 && e.status === "idle") status = "working"
          else if (roll > 0.9 && e.status === "working") status = "idle"
          const completion = Math.max(
            40,
            Math.min(99, e.completion + (Math.random() > 0.5 ? 1 : -1)),
          )
          return { ...e, status, completion }
        })
      })
    }, 1600)
    return () => clearInterval(id)
  }, [running])

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId],
  )

  const activeStaff = employees.filter(
    (e) => e.status === "working" || e.status === "meeting",
  ).length
  const activeTasks = tasks.filter((t) => t.state === "active").length
  const doneTasks = tasks.filter((t) => t.state === "done").length

  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={{ background: "var(--po-ink)" }}>
      {/* 상단 툴바 */}
      <TopBar
        activeStaff={activeStaff}
        totalStaff={employees.length}
        activeTasks={activeTasks}
        doneTasks={doneTasks}
        running={running}
        currentView={currentView}
        isDebugOpen={isDebugOpen}
        onNavigate={(view) => setCurrentView(view)}
        onToggleRun={() => setRunning((r) => !r)}
        onToggleDebug={() => setIsDebugOpen((prev) => !prev)}
      />

      {/* 디버그 콘솔 패널 */}
      <DebugConsole
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
      />

      <div className="flex min-h-0 flex-1">
        {currentView === "map" ? (
          <OfficeView
            employees={employees}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <AdminView />
        )}

        <TaskSidebar
          employee={selected}
          employees={employees}
          tasks={tasks}
          onStatus={handleStatus}
          onAddTask={handleAddTask}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onFocusAssignee={setSelectedId}
        />
      </div>
    </div>
  )
}