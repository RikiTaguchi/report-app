"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { PlusIcon } from "@/components/icons";
import { ProfileImageModal } from "./ProfileImageModal";

const HIGHLIGHTS = [
  { key: "study", seed: "profile-highlight-study", label: "勉強" },
  { key: "goal", seed: "profile-highlight-goal", label: "目標" },
  { key: "report", seed: "profile-highlight-report", label: "レポート" },
  { key: "memory", seed: "profile-highlight-memory", label: "思い出" },
  { key: "effort", seed: "profile-highlight-effort", label: "頑張り" },
  { key: "daily", seed: "profile-highlight-daily", label: "日常" },
];

const GRID_SEEDS = Array.from({ length: 12 }, (_, i) => `profile-grid-${i}`);

export default function StudentSettingsPage() {
  const { user, updateProfileImageUrl } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="page ig-profile-page">
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
        <div className="ig-profile-stats">
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">{GRID_SEEDS.length}</div>
            <div className="ig-profile-stat-label">投稿</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">???</div>
            <div className="ig-profile-stat-label">フォロワー</div>
          </div>
          <div className="ig-profile-stat">
            <div className="ig-profile-stat-num">???</div>
            <div className="ig-profile-stat-label">フォロー中</div>
          </div>
        </div>
      </div>

      <div className="ig-profile-bio">
        <div className="ig-profile-name">{user?.name}</div>
        <div className="ig-profile-handle-row">
          <span className="ig-profile-handle">@{user?.username}</span>
          <span className="badge badge-muted">生徒</span>
        </div>
        <div className="ig-profile-note">
          アカウント情報の変更・パスワードの再設定は担当講師または管理者にお問い合わせください。
        </div>
      </div>

      <div className="ig-story-scroll">
        {HIGHLIGHTS.map((h) => (
          <div key={h.key} className="ig-story-scroll-item">
            <div className="ig-story-avatar-ring">
              <div className="ig-story-avatar">
                <img
                  src={`https://picsum.photos/seed/${h.seed}/100/100`}
                  alt=""
                  className="ig-story-avatar-photo"
                />
              </div>
            </div>
            <div className="ig-story-scroll-item-label">{h.label}</div>
          </div>
        ))}
      </div>

      <div className="ig-profile-grid">
        {GRID_SEEDS.map((seed) => (
          <div key={seed} className="ig-profile-grid-item">
            <img src={`https://picsum.photos/seed/${seed}/400/400`} alt="" />
          </div>
        ))}
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
