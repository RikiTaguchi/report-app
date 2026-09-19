"use client";

import { useAuth } from "@/context/AuthContext";

export default function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>設定</h1>
      </div>

      <div className="card">
        <div className="stack">
          <div>
            <div className="label">氏名</div>
            <div>{user?.name}</div>
          </div>
          <div>
            <div className="label">ユーザー名</div>
            <div>{user?.username}</div>
          </div>
          <div>
            <div className="label">権限</div>
            <div>管理者</div>
          </div>
        </div>
      </div>
    </div>
  );
}
