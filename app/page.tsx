import { OfficeApp } from "@/components/office-app"
import { db } from "@/lib/db"

export default async function Page() {
  // DB에서 users 데이터 불러오기
  let users: any[] = [];
  try {
    const [rows]: any = await db.query('SELECT * FROM users');
    users = rows;
  } catch (error) {
    console.error("DB 연결 에러:", error);
  }

  return (
    <div>
      {/* DB 데이터가 잘 나오는지 연동 테스트용 상단 표시 */}
      <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <strong>[DB 연동 테스트]</strong>
        {users.length > 0 ? (
          users.map((u) => <span key={u.id} style={{ marginLeft: '10px' }}>{u.name} ({u.email})</span>)
        ) : (
          <span style={{ marginLeft: '10px' }}>데이터가 없거나 DB 연결 실패</span>
        )}
      </div>

      {/* 기존 앱 화면 */}
      <OfficeApp />
    </div>
  )
}