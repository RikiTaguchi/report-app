"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/icons";
import { ProfileImageModal } from "./ProfileImageModal";

export default function TeacherSettingsPage() {
  const { user, updateProfileImageUrl } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="page ig-profile-page">
      <div className="page-header">
        <h1>設定</h1>
      </div>

      <div className="ig-profile-top">
        <div className="ig-profile-avatar-lg-wrap">
          <div className="ig-profile-avatar-lg">
            <Avatar
              src={user?.profileImageUrl}
              name={user?.name}
              photoClassName="ig-profile-avatar-lg-photo"
            />
          </div>
          <button
            type="button"
            className="ig-profile-avatar-edit-btn"
            onClick={() => setModalOpen(true)}
            aria-label="プロフィール画像を変更"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <div className="ig-profile-bio">
        <div className="ig-profile-name">{user?.name}</div>
        <div className="ig-profile-handle-row">
          <span className="ig-profile-handle">@{user?.username}</span>
          <span className="badge badge-muted">講師</span>
        </div>
        <div className="ig-profile-note">
          プロフィール画像を変更できます。アカウント情報の変更・パスワードの再設定は管理者にお問い合わせください。
        </div>
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
            <div>講師</div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ProfileImageModal
          currentImageUrl={user?.profileImageUrl ?? null}
          name={user?.name}
          onClose={() => setModalOpen(false)}
          onUpdated={updateProfileImageUrl}
        />
      )}
    </div>
  );
}
