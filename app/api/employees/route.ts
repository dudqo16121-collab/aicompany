// app/api/employees/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 1. 직원 전체 목록 조회 (GET)
export async function GET() {
  try {
    const [rows]: any = await db.query('SELECT * FROM employees ORDER BY created_at ASC')
    
    // DB 데이터가 비어있거나 null 필드가 있을 때 UI가 깨지지 않도록 기본값 보장
    const formattedRows = (rows || []).map((emp: any) => ({
      ...emp,
      name: emp.name || '이름 없음',
      role: emp.role || '사원',
      dept: emp.dept || 'dev',
      status: emp.status || 'idle',
      task: emp.task || '',
      autonomy: emp.autonomy ?? 50,
      judgement: emp.judgement ?? 50,
      completion: emp.completion ?? 50,
    }))

    return NextResponse.json(formattedRows)
  } catch (error) {
    console.error('직원 목록 조회 실패 상세:', error)
    return NextResponse.json({ error: '직원 목록 조회 실패' }, { status: 500 })
  }
}

// 2. 신규 직원 추가 (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      id,
      name,
      role,
      dept,
      shirt,
      hair,
      skin,
      status,
      task,
      autonomy,
      judgement,
      completion,
    } = body

    const empId = id || `emp_${Date.now()}`

    await db.query(
      `INSERT INTO employees (id, name, role, dept, shirt, hair, skin, status, task, autonomy, judgement, completion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empId,
        name || '신규 직원',
        role || '사원',
        dept || 'dev',
        shirt || '#3b82f6',
        hair || '#333333',
        skin || '#fde047',
        status || 'idle',
        task || '',
        autonomy ?? 50,
        judgement ?? 50,
        completion ?? 50,
      ]
    )

    const newEmployee = {
      id: empId,
      name: name || '신규 직원',
      role: role || '사원',
      dept: dept || 'dev',
      shirt: shirt || '#3b82f6',
      hair: hair || '#333333',
      skin: skin || '#fde047',
      status: status || 'idle',
      task: task || '',
      autonomy: autonomy ?? 50,
      judgement: judgement ?? 50,
      completion: completion ?? 50,
    }

    return NextResponse.json({ message: '직원 추가 성공', employee: newEmployee }, { status: 201 })
  } catch (error) {
    console.error('직원 추가 실패 상세:', error)
    return NextResponse.json({ error: '직원 추가 실패' }, { status: 500 })
  }
}

// 3. 직원 정보 수정 (PUT)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: '직원 ID가 필요합니다.' }, { status: 400 })
    }

    // DB 스키마에 존재하지 않거나 자동 생성되는 필드 제외
    delete updateFields.created_at

    const keys = Object.keys(updateFields)
    if (keys.length === 0) {
      return NextResponse.json({ message: '수정할 필드가 없습니다.' })
    }

    const fields = keys.map((key) => `${key} = ?`).join(', ')
    const values = Object.values(updateFields)

    await db.query(`UPDATE employees SET ${fields} WHERE id = ?`, [...values, id])

    return NextResponse.json({ message: '직원 정보 수정 성공' })
  } catch (error) {
    console.error('직원 수정 실패 상세:', error)
    return NextResponse.json({ error: '직원 수정 실패' }, { status: 500 })
  }
}

// 4. 직원 삭제 (DELETE)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '직원 ID가 필요합니다.' }, { status: 400 })
    }

    await db.query('DELETE FROM employees WHERE id = ?', [id])
    return NextResponse.json({ message: '직원 삭제 성공' })
  } catch (error) {
    console.error('직원 삭제 실패 상세:', error)
    return NextResponse.json({ error: '직원 삭제 실패' }, { status: 500 })
  }
}