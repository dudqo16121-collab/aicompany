"use client"

import { useState } from "react"
import { 
  DEPARTMENTS, 
  EMPLOYEES, 
  STATUS_META, 
  type Department, 
  type DepartmentId, 
  type Employee 
} from "@/lib/office-data"

const deptName = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.name ?? ""
const deptWall = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.wall ?? "#555"

export function AdminView() {
  const [systemMode, setSystemMode] = useState<"auto" | "manual" | "maintenance">("auto")
  const [autoAssign, setAutoAssign] = useState(true)
  const [workSpeed, setWorkSpeed] = useState(100)

  // 직원 목록 및 상태 관리 State
  const [employeeList, setEmployeeList] = useState<Employee[]>(EMPLOYEES)
  const [departmentList, setDepartmentList] = useState<Department[]>(DEPARTMENTS)
  const [rolesList, setRolesList] = useState<string[]>([
    "시니어 개발자",
    "백엔드 개발자",
    "프론트엔드 개발자",
    "UI/UX 디자이너",
    "마케팅 매니저",
    "인사 담당자",
  ])

  // 직급/역할 및 부서 추가 Form State
  const [newRoleInput, setNewRoleInput] = useState("")
  const [newDeptNameInput, setNewDeptNameInput] = useState("")
  const [newDeptColorInput, setNewDeptColorInput] = useState("#42b2cb")

  // 커스텀 [예 / 아니오] 모달 State
const [modalConfig, setModalConfig] = useState<{
  isOpen: boolean
  title: string
  message: string
  type?: "info" | "warning" | "danger"
  onConfirm?: () => void
}>({
  isOpen: false,
  title: "",
  message: "",
  type: "info",
})

// 커스텀 확인 창 호출 함수
const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  type: "info" | "warning" | "danger" = "info"
) => {
  setModalConfig({
    isOpen: true,
    title,
    message,
    type,
    onConfirm,
  })
}

  // 🎯 DepartmentId 및 Department 타입 단언으로 빨간 줄 완벽 해결
  const handleAddDepartment = () => {
    if (!newDeptNameInput.trim()) return
    const newDeptId = `dept_${Date.now()}` as DepartmentId

    const newDept: Department = {
      id: newDeptId,
      name: newDeptNameInput.trim(),
      wall: newDeptColorInput,
      floor: "#d3c3a9",
      side: "left",
      order: departmentList.length + 1,
    }

    setDepartmentList((prev) => [...prev, newDept])
    setNewDeptNameInput("")
  }

  // 직급/역할 추가 핸들러
  const handleAddRole = () => {
    if (!newRoleInput.trim()) return
    if (rolesList.includes(newRoleInput.trim())) return
    setRolesList((prev) => [...prev, newRoleInput.trim()])
    setNewRoleInput("")
  }

  // 직원 퇴사/삭제 처리
  const handleDeleteEmployee = (empId: string, empName: string) => {
    showConfirm(
      "직원 퇴사 처리",
      `'${empName}' 직원을 퇴사(삭제) 처리하시겠습니까? 관련 데이터가 초기화됩니다.`,
      () => setEmployeeList((prev) => prev.filter((e) => e.id !== empId)),
      "danger"
    )
  }

  // 직원 상태 강제 변경
  const handleStatusChange = (empId: string, newStatus: Employee["status"]) => {
    setEmployeeList((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, status: newStatus } : e))
    )
  }

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto po-scroll flex flex-col gap-4 relative" style={{ background: "var(--po-bg-blue, #42b2cb)" }}>
      {/* 헤더 카드 */}
      <div className="p-4 pixel-soft flex items-center justify-between" style={{ background: "var(--po-panel-light)" }}>
        <div>
          <h1 className="font-pixel text-[18px]" style={{ color: "var(--po-ink2)" }}>
            ⚙️ AI 오피스 관리자 설정 페이지
          </h1>
          <p className="font-pixel-sm text-[11px] mt-1" style={{ color: "var(--po-ink2-soft)" }}>
            전체 오피스 동작 시스템 제어 및 직원/부서 리소스를 통합 관리합니다.
          </p>
        </div>
        <span
          className="font-pixel-sm px-3 py-1 text-[11px] pixel-soft-sm"
          style={{ background: "var(--po-mint)", color: "var(--po-ink2)" }}
        >
          총 직원: {employeeList.length}명
        </span>
      </div>

      {/* 상단 3컬럼 영역: 모드 설정 / 환경 제어 / 조직 설정 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. 운용 모드 설정 */}
        <div className="p-4 pixel-soft flex flex-col gap-3" style={{ background: "var(--po-panel-light)" }}>
          <h2 className="font-pixel text-[13px] border-b-2 pb-2" style={{ color: "var(--po-ink2)", borderColor: "var(--po-line)" }}>
            🔄 운용 모드 설정
          </h2>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                showConfirm(
                  "완전 자동화 모드 전환",
                  "완전 자동화 모드로 변경하시겠습니까? AI 직원들이 자율적으로 업무를 진행합니다.",
                  () => setSystemMode("auto"),
                  "info"
                )
              }}
              className={`p-3 text-left pixel-soft-sm transition-all ${
                systemMode === "auto" ? "po-sheen-soft ring-2 ring-[var(--po-mint-deep)]" : ""
              }`}
              style={{ background: systemMode === "auto" ? "var(--po-mint)" : "#fff" }}
            >
              <p className="font-pixel text-[12px]" style={{ color: "var(--po-ink2)" }}>🤖 완전 자동화 모드</p>
              <p className="font-pixel-sm text-[9px] mt-1" style={{ color: "var(--po-ink2-soft)" }}>
                AI 직원들이 자율적으로 작업을 분담하고 진행합니다.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                showConfirm(
                  "수동 제어 모드 전환",
                  "수동 제어 모드로 변경하시겠습니까? 관리 지시 업무만 진행합니다.",
                  () => setSystemMode("manual"),
                  "warning"
                )
              }}
              className={`p-3 text-left pixel-soft-sm transition-all ${
                systemMode === "manual" ? "po-sheen-soft ring-2 ring-[var(--po-peach-deep)]" : ""
              }`}
              style={{ background: systemMode === "manual" ? "var(--po-lemon)" : "#fff" }}
            >
              <p className="font-pixel text-[12px]" style={{ color: "var(--po-ink2)" }}>👨‍💼 수동 제어 모드</p>
              <p className="font-pixel-sm text-[9px] mt-1" style={{ color: "var(--po-ink2-soft)" }}>
                관리자가 직접 사이드바에서 지시한 작업만 수행합니다.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                showConfirm(
                  "점검 모드 전환",
                  "점검 모드로 전환하시겠습니까? 모든 직원의 업무가 즉시 정지되고 휴식 상태로 들어갑니다.",
                  () => setSystemMode("maintenance"),
                  "warning"
                )
              }}
              className={`p-3 text-left pixel-soft-sm transition-all ${
                systemMode === "maintenance" ? "po-sheen-soft ring-2 ring-[var(--po-peach-deep)]" : ""
              }`}
              style={{ background: systemMode === "maintenance" ? "var(--po-peach)" : "#fff" }}
            >
              <p className="font-pixel text-[12px]" style={{ color: "var(--po-ink2)" }}>🛠️ 정기 점검 모드</p>
              <p className="font-pixel-sm text-[9px] mt-1" style={{ color: "var(--po-ink2-soft)" }}>
                신규 작업을 중지하고 휴식 상태로 전환합니다.
              </p>
            </button>
          </div>
        </div>

        {/* 2. 시뮬레이션 옵션 & 긴급 제어 */}
        <div className="p-4 pixel-soft flex flex-col gap-3" style={{ background: "var(--po-panel-light)" }}>
          <h2 className="font-pixel text-[13px] border-b-2 pb-2" style={{ color: "var(--po-ink2)", borderColor: "var(--po-line)" }}>
            ⚡ 시뮬레이션 환경 제어
          </h2>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-pixel-sm text-[11px]" style={{ color: "var(--po-ink2)" }}>작업 진행 속도</span>
                <span className="font-pixel text-[11px]" style={{ color: "var(--po-ink2)" }}>{workSpeed}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={workSpeed}
                onChange={(e) => setWorkSpeed(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 pixel-soft-in" style={{ background: "#fff" }}>
              <span className="font-pixel-sm text-[11px]" style={{ color: "var(--po-ink2)" }}>자동 작업 배정</span>
              <button
                type="button"
                onClick={() => {
                  const nextState = !autoAssign
                  showConfirm(
                    "자동 작업 배정 설정",
                    `자동 작업 배정 옵션을 ${nextState ? "ON" : "OFF"} 상태로 변경하시겠습니까?`,
                    () => setAutoAssign(nextState),
                    "info"
                  )
                }}
                className="font-pixel-sm px-2.5 py-1 text-[10px] pixel-soft-sm"
                style={{ background: autoAssign ? "var(--po-mint)" : "var(--po-lilac)", color: "var(--po-ink2)" }}
              >
                {autoAssign ? "ON" : "OFF"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                showConfirm(
                  "전체 작업 강제 중단",
                  "정말로 모든 직원의 수행 중인 작업을 강제 중단하시겠습니까?",
                  () => {},
                  "danger"
                )
              }}
              className="po-sheen-soft font-pixel-sm p-2 text-[10px] pixel-soft-sm active:translate-y-[1px] text-left mt-1"
              style={{ background: "var(--po-coral)", color: "#fff" }}
            >
              🚨 전체 작업 강제 중단 (Stop All)
            </button>
          </div>
        </div>

        {/* 3. 부서 및 직급/역할 설정 추가 공간 */}
        <div className="p-4 pixel-soft flex flex-col gap-3" style={{ background: "var(--po-panel-light)" }}>
          <h2 className="font-pixel text-[13px] border-b-2 pb-2" style={{ color: "var(--po-ink2)", borderColor: "var(--po-line)" }}>
            🏛️ 부서 및 직급/역할 추가
          </h2>

          {/* 신규 부서 추가 */}
          <div className="p-2.5 pixel-soft-in flex flex-col gap-2" style={{ background: "#fff" }}>
            <span className="font-pixel-sm text-[10px]" style={{ color: "var(--po-ink2)" }}>신규 부서 생성</span>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="부서명 (예: Research)"
                value={newDeptNameInput}
                onChange={(e) => setNewDeptNameInput(e.target.value)}
                className="font-pixel-sm px-2 py-1 text-[10px] pixel-soft-in outline-none flex-1"
              />
              <input
                type="color"
                value={newDeptColorInput}
                onChange={(e) => setNewDeptColorInput(e.target.value)}
                className="h-7 w-7 cursor-pointer shrink-0"
                title="부서 대표 색상 지정"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newDeptNameInput.trim()) return
                  showConfirm(
                    "신규 부서 생성",
                    `'${newDeptNameInput}' 부서를 추가하시겠습니까?`,
                    handleAddDepartment,
                    "info"
                  )
                }}
                className="po-sheen-soft font-pixel-sm px-2 py-1 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-mint)", color: "var(--po-ink2)" }}
              >
                추가
              </button>
            </div>
          </div>

          {/* 신규 직급/역할 추가 */}
          <div className="p-2.5 pixel-soft-in flex flex-col gap-2" style={{ background: "#fff" }}>
            <span className="font-pixel-sm text-[10px]" style={{ color: "var(--po-ink2)" }}>신규 직급/역할 추가</span>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="역할명 (예: AI 연구원)"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                className="font-pixel-sm px-2 py-1 text-[10px] pixel-soft-in outline-none flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newRoleInput.trim()) return
                  showConfirm(
                    "직급/역할 추가",
                    `'${newRoleInput}' 역할을 시스템에 등록하시겠습니까?`,
                    handleAddRole,
                    "info"
                  )
                }}
                className="po-sheen-soft font-pixel-sm px-2 py-1 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-peach)", color: "var(--po-ink2)" }}
              >
                등록
              </button>
            </div>
            {/* 등록된 직급 태그들 */}
            <div className="flex flex-wrap gap-1 mt-1 max-h-[60px] overflow-y-auto po-scroll">
              {rolesList.map((r, idx) => (
                <span
                  key={idx}
                  className="font-pixel-sm px-1.5 py-0.5 text-[9px] pixel-soft-sm"
                  style={{ background: "var(--po-panel-light-2)", color: "var(--po-ink2)" }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 전체 직원 통합 관리 테이블/리스트 */}
      <div className="p-4 pixel-soft flex flex-col gap-3" style={{ background: "var(--po-panel-light)" }}>
        <div className="flex items-center justify-between border-b-2 pb-2" style={{ borderColor: "var(--po-line)" }}>
          <h2 className="font-pixel text-[14px]" style={{ color: "var(--po-ink2)" }}>
            👥 전체 직원 통합 관리 ({employeeList.length}명)
          </h2>
          <span className="font-pixel-sm text-[10px]" style={{ color: "var(--po-ink2-soft)" }}>
            직원별 실시간 상태 변경 및 퇴사(삭제) 처리가 가능합니다.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="font-pixel-sm text-[10px] border-b-2" style={{ borderColor: "var(--po-line)", color: "var(--po-ink2-soft)" }}>
                <th className="p-2">프로필</th>
                <th className="p-2">이름</th>
                <th className="p-2">부서</th>
                <th className="p-2">역할 / 직급</th>
                <th className="p-2">현재 상태</th>
                <th className="p-2">능력치 (자/판/완)</th>
                <th className="p-2 text-right">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--po-line)]">
              {employeeList.map((emp) => {
                const meta = STATUS_META[emp.status]
                return (
                  <tr key={emp.id} className="hover:bg-[#fff4e2] transition-colors">
                    {/* 아바타 */}
                    <td className="p-2">
                      <div
                        className="relative flex h-8 w-8 shrink-0 flex-col items-center justify-end overflow-hidden pixel-soft"
                        style={{ background: deptWall(emp.dept) }}
                      >
                        <div className="relative h-[3px] w-[12px]" style={{ background: emp.hair }} />
                        <div className="relative flex h-[7px] w-[12px] items-center justify-center gap-[1px]" style={{ background: emp.skin }}>
                          <span className="h-[1px] w-[1px]" style={{ background: "var(--po-ink)" }} />
                          <span className="h-[1px] w-[1px]" style={{ background: "var(--po-ink)" }} />
                        </div>
                        <div className="relative h-[8px] w-[16px]" style={{ background: emp.shirt }} />
                      </div>
                    </td>

                    {/* 이름 */}
                    <td className="p-2 font-pixel text-[11px]" style={{ color: "var(--po-ink2)" }}>
                      {emp.name}
                    </td>

                    {/* 부서 */}
                    <td className="p-2">
                      <span
                        className="font-pixel-sm px-1.5 py-0.5 text-[9px] pixel-soft-sm"
                        style={{ background: deptWall(emp.dept), color: "#fff" }}
                      >
                        {deptName(emp.dept)}
                      </span>
                    </td>

                    {/* 역할 */}
                    <td className="p-2 font-pixel-sm text-[10px]" style={{ color: "var(--po-ink2)" }}>
                      {emp.role}
                    </td>

                    {/* 실시간 상태 수동 변경 */}
                    <td className="p-2">
                      <select
                        value={emp.status}
                        onChange={(e) => handleStatusChange(emp.id, e.target.value as Employee["status"])}
                        className="font-pixel-sm px-1.5 py-0.5 text-[9px] pixel-soft-in outline-none"
                        style={{ background: meta.color, color: "var(--po-ink2)" }}
                      >
                        <option value="working">근무중</option>
                        <option value="idle">대기중</option>
                        <option value="meeting">회의중</option>
                        <option value="break">휴식중</option>
                      </select>
                    </td>

                    {/* 능력치 요약 */}
                    <td className="p-2 font-pixel-sm text-[9px]" style={{ color: "var(--po-ink2-soft)" }}>
                      {emp.autonomy} / {emp.judgement} / {emp.completion}
                    </td>

                    {/* 퇴사 / 삭제 버튼 */}
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="po-sheen-soft font-pixel-sm px-2 py-0.5 text-[9px] pixel-soft-sm active:translate-y-[1px]"
                        style={{ background: "var(--po-coral)", color: "#fff" }}
                      >
                        퇴사 처리
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* [예] [아니오] 모달 */}
      {modalConfig.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="w-[320px] p-4 pixel-soft shadow-2xl transition-all"
            style={{
              background: "var(--po-panel-light)",
              border: "3px solid var(--po-line)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-3 border-b-2 pb-2" style={{ borderColor: "var(--po-line)" }}>
              <span
                className="h-3 w-3 pixel-soft-sm shrink-0"
                style={{
                  background:
                    modalConfig.type === "danger"
                      ? "var(--po-coral)"
                      : modalConfig.type === "warning"
                      ? "var(--po-lemon)"
                      : "var(--po-mint)",
                }}
              />
              <h3 className="font-pixel text-[13px]" style={{ color: "var(--po-ink2)" }}>
                {modalConfig.title}
              </h3>
            </div>

            {/* 내용 */}
            <div className="p-3 mb-4 pixel-soft-in" style={{ background: "#fff4e2" }}>
              <p className="font-pixel-sm text-[11px] leading-relaxed" style={{ color: "var(--po-ink2)" }}>
                {modalConfig.message}
              </p>
            </div>

            {/* 버튼: [예]가 왼쪽, [아니오]가 오른쪽 */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalConfig((prev) => ({ ...prev, isOpen: false }))
                  if (modalConfig.onConfirm) modalConfig.onConfirm()
                }}
                className="po-sheen-soft font-pixel-sm px-3.5 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{
                  background: modalConfig.type === "danger" ? "var(--po-coral)" : "var(--po-mint)",
                  color: modalConfig.type === "danger" ? "#fff" : "var(--po-ink2)",
                }}
              >
                예
              </button>

              <button
                type="button"
                onClick={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                className="po-sheen-soft font-pixel-sm px-3.5 py-1.5 text-[10px] pixel-soft-sm active:translate-y-[1px]"
                style={{ background: "var(--po-lilac)", color: "var(--po-ink2)" }}
              >
                아니오
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}