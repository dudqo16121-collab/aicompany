// app/api/tasks/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 1. 작업 목록 전체 조회 (GET)
export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM tasks ORDER BY created_at DESC')
    return NextResponse.json(rows)
  } catch (error) {
    console.error('작업 목록 조회 실패 상세:', error)
    return NextResponse.json({ error: '작업 목록 조회 실패' }, { status: 500 })
  }
}

// 2. 신규 작업 추가 (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, title, dept, priority, progress, state, assignee, assignee_id } = body

    const taskId = id || `t${Date.now()}`
    
    let mappedPriority = 1
    if (typeof priority === 'number') {
      mappedPriority = priority
    } else if (priority === '낮음') {
      mappedPriority = 1
    } else if (priority === '보통') {
      mappedPriority = 2
    } else if (priority === '높음') {
      mappedPriority = 3
    }

    const assignedUser = assignee_id || assignee || null

    await db.query(
      `INSERT INTO tasks (id, title, dept, priority, progress, state, assignee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        title || '새로운 작업',
        dept || 'dev',
        mappedPriority,
        progress ?? 0,
        state || 'queued',
        assignedUser,
      ]
    )

    const newTask = {
      id: taskId,
      title: title || '새로운 작업',
      dept: dept || 'dev',
      priority: priority || '보통',
      progress: progress ?? 0,
      state: state || 'queued',
      assignee: assignedUser || '',
    }

    return NextResponse.json({ message: '작업 추가 성공', task: newTask }, { status: 201 })
  } catch (error) {
    console.error('작업 추가 실패 상세:', error)
    return NextResponse.json({ error: '작업 추가 실패' }, { status: 500 })
  }
}

// 3. 작업 정보 수정 (PUT)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: '작업 ID가 필요합니다.' }, { status: 400 })
    }

    if ('assignee' in updateFields) {
      updateFields.assignee_id = updateFields.assignee
      delete updateFields.assignee
    }

    if ('priority' in updateFields && typeof updateFields.priority === 'string') {
      if (updateFields.priority === '낮음') updateFields.priority = 1
      else if (updateFields.priority === '보통') updateFields.priority = 2
      else if (updateFields.priority === '높음') updateFields.priority = 3
    }

    const fields = Object.keys(updateFields)
      .map((key) => `${key} = ?`)
      .join(', ')
    const values = Object.values(updateFields)

    if (fields.length > 0) {
      await db.query(`UPDATE tasks SET ${fields} WHERE id = ?`, [...values, id])
    }

    return NextResponse.json({ message: '작업 정보 수정 성공' })
  } catch (error) {
    console.error('작업 정보 수정 실패 상세:', error)
    return NextResponse.json({ error: '작업 정보 수정 실패' }, { status: 500 })
  }
}

// 4. 작업 삭제 (DELETE)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '작업 ID가 필요합니다.' }, { status: 400 })
    }

    await db.query('DELETE FROM tasks WHERE id = ?', [id])
    return NextResponse.json({ message: '작업 삭제 성공' })
  } catch (error) {
    console.error('작업 삭제 실패 상세:', error)
    return NextResponse.json({ error: '작업 삭제 실패' }, { status: 500 })
  }
}