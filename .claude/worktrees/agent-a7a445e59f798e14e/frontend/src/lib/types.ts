// Mirrors backend DTOs in backend/src/main/java/.../web/dto/*.java

export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type ActorType = "STUDENT" | "TEACHER";
export type ReportItemType = "CHECKBOX" | "TEXT";

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  profileImageUrl: string | null;
}

export interface ErrorResponse {
  message: string;
}

// ---- Subjects / report item definitions ----

export interface SubjectResponse {
  id: string;
  name: string;
  displayOrder: number;
}

export interface ReportItemDefinitionResponse {
  id: string;
  subtitleId: string;
  itemType: ReportItemType;
  label: string;
  displayOrder: number;
}

export interface ReportItemDefinitionCreateRequest {
  label: string;
  itemType: ReportItemType;
}

export type ReportItemDefinitionUpdateRequest = ReportItemDefinitionCreateRequest;

export interface ReportItemReorderRequest {
  itemType: ReportItemType;
  orderedIds: string[];
}

export interface ReportItemGroupResponse {
  id: string;
  studentId: string;
  goalId: string;
  goalTitle: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportItemGroupCreateRequest {
  goalId: string;
}

export interface ReportItemSubtitleResponse {
  id: string;
  groupId: string;
  label: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportItemSubtitleCreateRequest {
  label: string;
}

export type ReportItemSubtitleUpdateRequest = ReportItemSubtitleCreateRequest;

export interface StudentReportItemResponse {
  id: string;
  subtitleId: string;
  subtitleLabel: string;
  itemType: ReportItemType;
  label: string;
  displayOrder: number;
  goalId: string | null;
  goalTitle: string | null;
}

// ---- Daily reports ----

export interface ReportItemResponseDTO {
  reportItemDefinitionId: string;
  label: string;
  itemType: ReportItemType;
  checked: boolean | null;
  textValue: string | null;
}

export interface StudyTimeRecordDTO {
  subjectId: string;
  subjectName: string;
  minutes: number;
}

export interface DailyReportDetailResponse {
  id: string;
  reportDate: string;
  items: ReportItemResponseDTO[];
  studyTimes: StudyTimeRecordDTO[];
  freeText: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportListItemResponse {
  id: string;
  reportDate: string;
  submittedAt: string | null;
}

export interface DailyReportItemRequest {
  reportItemDefinitionId: string;
  checked?: boolean | null;
  textValue?: string | null;
}

export interface DailyReportStudyTimeRequest {
  subjectId: string;
  minutes: number;
}

export interface DailyReportSubmitRequest {
  items: DailyReportItemRequest[];
  studyTimes: DailyReportStudyTimeRequest[];
  freeText: string | null;
}

// ---- Report social (comments / likes / images) ----

export interface ReportCommentRequest {
  content: string;
}

export interface ReportCommentResponse {
  id: string;
  authorType: ActorType;
  authorId: string;
  authorName: string | null;
  authorProfileImageUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportImageResponse {
  id: string;
  imageUrl: string;
  createdAt: string;
}

export interface ReportLikeStatusResponse {
  liked: boolean;
  count: number;
}

export interface CommentEvent<T> {
  eventType: "CREATED" | "UPDATED" | "DELETED";
  commentId: string;
  comment: T | null;
}

export interface ReportSubmittedEvent {
  studentId: string;
  studentName: string;
  teacherId: string | null;
  reportDate: string;
  submittedAt: string;
}

// ---- Blogs ----

export interface BlogResponse {
  id: string;
  teacherId: string;
  teacherName: string | null;
  title: string;
  content: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface BlogCreateRequest {
  title: string;
  content: string;
}

export type BlogUpdateRequest = BlogCreateRequest;

export interface BlogCommentRequest {
  content: string;
  parentCommentId?: string | null;
}

export interface BlogCommentResponse {
  id: string;
  blogId: string;
  authorType: ActorType;
  authorId: string;
  authorName: string | null;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogImageResponse {
  id: string;
  imageUrl: string;
  createdAt: string;
}

// ---- Goals ----

export interface GoalProgressResponse {
  id: string;
  goalId: string;
  progressPercent: number;
  comment: string | null;
  recordedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalResponse {
  id: string;
  studentId: string;
  teacherId: string | null;
  teacherName: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  latestProgress: GoalProgressResponse | null;
  createdAt: string;
  updatedAt: string;
  reportItemSubtitleLabels: string[];
}

export interface GoalCreateRequest {
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
}

export type GoalUpdateRequest = GoalCreateRequest;

export interface GoalProgressCreateRequest {
  progressPercent: number;
  comment?: string | null;
  recordedDate: string;
}

export type GoalProgressUpdateRequest = GoalProgressCreateRequest;

// ---- Dashboard ----

export interface StudentDashboardResponse {
  goals: GoalResponse[];
  consecutiveSubmissionDays: number;
  submittedToday: boolean;
  studyTimeSummary: StudyTimeRecordDTO[];
  totalStudyMinutes: number;
}

// ---- Accounts ----

export interface TeacherResponse {
  id: string;
  username: string;
  name: string;
  lastName: string;
  firstName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherCreateRequest {
  username: string;
  password: string;
  lastName: string;
  firstName: string;
}

export interface TeacherUpdateRequest {
  lastName: string;
  firstName: string;
}

export interface StudentResponse {
  id: string;
  username: string;
  name: string;
  lastName: string;
  firstName: string;
  teacherId: string | null;
  teacherName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCreateRequest {
  username: string;
  password: string;
  lastName: string;
  firstName: string;
  teacherId: string;
}

export interface StudentUpdateRequest {
  lastName: string;
  firstName: string;
  teacherId: string;
}

export interface PasswordResetRequest {
  newPassword: string;
}

export interface StudentProfileImageResponse {
  profileImageUrl: string | null;
}

// ---- Auth ----

export interface LoginRequest {
  username: string;
  password: string;
}
