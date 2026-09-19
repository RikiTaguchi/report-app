import type {
  BlogCommentRequest,
  BlogCommentResponse,
  BlogCreateRequest,
  BlogImageResponse,
  BlogResponse,
  BlogUpdateRequest,
  CurrentUser,
  DailyReportDetailResponse,
  DailyReportListItemResponse,
  DailyReportSubmitRequest,
  GoalCreateRequest,
  GoalFormRequest,
  GoalFormResponse,
  GoalProgressCreateRequest,
  GoalProgressResponse,
  GoalProgressUpdateRequest,
  GoalResponse,
  GoalUpdateRequest,
  LoginRequest,
  PasswordResetRequest,
  ReportCommentRequest,
  ReportCommentResponse,
  ReportImageResponse,
  ReportItemDefinitionResponse,
  ReportItemGroupCreateRequest,
  ReportItemGroupResponse,
  ReportItemSubtitleCreateRequest,
  ReportItemSubtitleResponse,
  ReportItemSubtitleUpdateRequest,
  ReportLikeStatusResponse,
  Role,
  StudentCreateRequest,
  StudentDashboardResponse,
  StudentProfileImageResponse,
  TeacherProfileImageResponse,
  StudentReportItemDefinitionsResponse,
  StudentReportItemResponse,
  StudentResponse,
  StudentUpdateRequest,
  SubjectResponse,
  TeacherCreateRequest,
  TeacherResponse,
  TeacherUpdateRequest,
} from "./types";

function resolveApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080";
  return configured.replace(/\/$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

function apiUrl(path: string): string {
  if (API_BASE_URL.endsWith("/api") && path.startsWith("/api")) {
    return `${API_BASE_URL}${path.slice(4)}`;
  }
  return `${API_BASE_URL}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let csrfEnsured: Promise<void> | null = null;

async function ensureCsrfCookie(): Promise<void> {
  if (getCookie("XSRF-TOKEN")) return;
  if (!csrfEnsured) {
    csrfEnsured = fetch(apiUrl("/api/auth/csrf"), {
      credentials: "include",
    }).then(() => undefined);
  }
  await csrfEnsured;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};

  if (MUTATING_METHODS.has(method)) {
    await ensureCsrfCookie();
    const token = getCookie("XSRF-TOKEN");
    if (token) headers["X-XSRF-TOKEN"] = token;
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `リクエストに失敗しました (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

async function upload<T>(path: string, file: File): Promise<T> {
  await ensureCsrfCookie();
  const token = getCookie("XSRF-TOKEN");
  const headers: Record<string, string> = {};
  if (token) headers["X-XSRF-TOKEN"] = token;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : `アップロードに失敗しました (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export function resolveFileUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return apiUrl(imageUrl);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authApi = {
  login(role: Role, req: LoginRequest) {
    const path =
      role === "ADMIN"
        ? "/api/auth/admin/login"
        : role === "TEACHER"
          ? "/api/auth/teacher/login"
          : "/api/auth/student/login";
    return request<CurrentUser>(path, { method: "POST", body: req });
  },
  logout() {
    return request<void>("/api/auth/logout", { method: "POST" });
  },
  me() {
    return request<CurrentUser>("/api/auth/me");
  },
};

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export const studentApi = {
  listSubjects() {
    return request<SubjectResponse[]>("/api/student/subjects");
  },
  listItemDefinitions(reportDate: string) {
    return request<StudentReportItemDefinitionsResponse>(
      `/api/student/report-item-definitions?reportDate=${reportDate}`
    );
  },
  listReports() {
    return request<DailyReportListItemResponse[]>("/api/student/reports");
  },
  getReport(reportDate: string) {
    return request<DailyReportDetailResponse>(`/api/student/reports/${reportDate}`);
  },
  saveReport(reportDate: string, req: DailyReportSubmitRequest, createOnly = false) {
    const query = createOnly ? "?createOnly=true" : "";
    return request<DailyReportDetailResponse>(`/api/student/reports/${reportDate}${query}`, {
      method: "PUT",
      body: req,
    });
  },
  deleteReport(reportDate: string) {
    return request<void>(`/api/student/reports/${reportDate}`, { method: "DELETE" });
  },
  listComments(reportDate: string) {
    return request<ReportCommentResponse[]>(`/api/student/reports/${reportDate}/comments`);
  },
  getLikeStatus(reportDate: string) {
    return request<ReportLikeStatusResponse>(`/api/student/reports/${reportDate}/likes`);
  },
  likeReport(reportDate: string) {
    return request<void>(`/api/student/reports/${reportDate}/likes`, { method: "POST" });
  },
  unlikeReport(reportDate: string) {
    return request<void>(`/api/student/reports/${reportDate}/likes`, { method: "DELETE" });
  },
  listImages(reportDate: string) {
    return request<ReportImageResponse[]>(`/api/student/reports/${reportDate}/images`);
  },
  uploadImage(reportDate: string, file: File) {
    return upload<ReportImageResponse>(`/api/student/reports/${reportDate}/images`, file);
  },
  deleteImage(reportDate: string, imageId: string) {
    return request<void>(`/api/student/reports/${reportDate}/images/${imageId}`, {
      method: "DELETE",
    });
  },
  listPublishedBlogs() {
    return request<BlogResponse[]>("/api/student/blogs");
  },
  getBlog(blogId: string) {
    return request<BlogResponse>(`/api/student/blogs/${blogId}`);
  },
  listBlogImages(blogId: string) {
    return request<BlogImageResponse[]>(`/api/student/blogs/${blogId}/images`);
  },
  listBlogComments(blogId: string) {
    return request<BlogCommentResponse[]>(`/api/student/blogs/${blogId}/comments`);
  },
  getBlogLikeStatus(blogId: string) {
    return request<ReportLikeStatusResponse>(`/api/student/blogs/${blogId}/likes`);
  },
  likeBlog(blogId: string) {
    return request<void>(`/api/student/blogs/${blogId}/likes`, { method: "POST" });
  },
  unlikeBlog(blogId: string) {
    return request<void>(`/api/student/blogs/${blogId}/likes`, { method: "DELETE" });
  },
  listGoals() {
    return request<GoalResponse[]>("/api/student/goals");
  },
  listGoalProgresses(goalId: string) {
    return request<GoalProgressResponse[]>(`/api/student/goals/${goalId}/progresses`);
  },
  getDashboard() {
    return request<StudentDashboardResponse>("/api/student/dashboard");
  },
  listTeachers() {
    return request<TeacherResponse[]>("/api/student/teachers");
  },
  uploadProfileImage(file: File) {
    return upload<StudentProfileImageResponse>("/api/student/profile/image", file);
  },
  deleteProfileImage() {
    return request<StudentProfileImageResponse>("/api/student/profile/image", { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Teacher
// ---------------------------------------------------------------------------

export const teacherApi = {
  uploadProfileImage(file: File) {
    return upload<TeacherProfileImageResponse>("/api/teacher/profile/image", file);
  },
  deleteProfileImage() {
    return request<TeacherProfileImageResponse>("/api/teacher/profile/image", { method: "DELETE" });
  },
  listStudents() {
    return request<StudentResponse[]>("/api/teacher/students");
  },
  listAllStudents() {
    return request<StudentResponse[]>("/api/teacher/students/all");
  },
  listReports(studentId: string) {
    return request<DailyReportListItemResponse[]>(`/api/teacher/students/${studentId}/reports`);
  },
  getReport(studentId: string, reportDate: string) {
    return request<DailyReportDetailResponse>(
      `/api/teacher/students/${studentId}/reports/${reportDate}`
    );
  },
  listComments(studentId: string, reportDate: string) {
    return request<ReportCommentResponse[]>(
      `/api/teacher/students/${studentId}/reports/${reportDate}/comments`
    );
  },
  createComment(studentId: string, reportDate: string, req: ReportCommentRequest) {
    return request<ReportCommentResponse>(
      `/api/teacher/students/${studentId}/reports/${reportDate}/comments`,
      { method: "POST", body: req }
    );
  },
  updateComment(studentId: string, reportDate: string, commentId: string, req: ReportCommentRequest) {
    return request<ReportCommentResponse>(
      `/api/teacher/students/${studentId}/reports/${reportDate}/comments/${commentId}`,
      { method: "PUT", body: req }
    );
  },
  deleteComment(studentId: string, reportDate: string, commentId: string) {
    return request<void>(
      `/api/teacher/students/${studentId}/reports/${reportDate}/comments/${commentId}`,
      { method: "DELETE" }
    );
  },
  getLikeStatus(studentId: string, reportDate: string) {
    return request<ReportLikeStatusResponse>(
      `/api/teacher/students/${studentId}/reports/${reportDate}/likes`
    );
  },
  like(studentId: string, reportDate: string) {
    return request<void>(`/api/teacher/students/${studentId}/reports/${reportDate}/likes`, {
      method: "POST",
    });
  },
  unlike(studentId: string, reportDate: string) {
    return request<void>(`/api/teacher/students/${studentId}/reports/${reportDate}/likes`, {
      method: "DELETE",
    });
  },
  listImages(studentId: string, reportDate: string) {
    return request<ReportImageResponse[]>(
      `/api/teacher/students/${studentId}/reports/${reportDate}/images`
    );
  },

  reportItemGroups: makeReportItemGroupsApi((studentId) => `/api/teacher/students/${studentId}`),
  goals: makeGoalsApi((studentId) => `/api/teacher/students/${studentId}`),
  goalForms: {
    get(studentId: string, goalId: string) {
      return request<GoalFormResponse>(`/api/teacher/students/${studentId}/goal-forms/${goalId}`);
    },
    create(studentId: string, req: GoalFormRequest) {
      return request<GoalFormResponse>(`/api/teacher/students/${studentId}/goal-forms`, {
        method: "POST",
        body: req,
      });
    },
    update(studentId: string, goalId: string, req: GoalFormRequest) {
      return request<GoalFormResponse>(`/api/teacher/students/${studentId}/goal-forms/${goalId}`, {
        method: "PUT",
        body: req,
      });
    },
  },
  getStudentDashboard(studentId: string) {
    return request<StudentDashboardResponse>(`/api/teacher/students/${studentId}/dashboard`);
  },

  listTeachers() {
    return request<TeacherResponse[]>("/api/teacher/teachers");
  },
  getTeacher(id: string) {
    return request<TeacherResponse>(`/api/teacher/teachers/${id}`);
  },
  listOwnBlogs() {
    return request<BlogResponse[]>("/api/teacher/blogs");
  },
  listPublishedBlogs() {
    return request<BlogResponse[]>("/api/teacher/blogs/published");
  },
  getBlog(blogId: string) {
    return request<BlogResponse>(`/api/teacher/blogs/${blogId}`);
  },
  createBlog(req: BlogCreateRequest) {
    return request<BlogResponse>("/api/teacher/blogs", { method: "POST", body: req });
  },
  updateBlog(blogId: string, req: BlogUpdateRequest) {
    return request<BlogResponse>(`/api/teacher/blogs/${blogId}`, { method: "PUT", body: req });
  },
  deleteBlog(blogId: string) {
    return request<void>(`/api/teacher/blogs/${blogId}`, { method: "DELETE" });
  },
  listBlogImages(blogId: string) {
    return request<BlogImageResponse[]>(`/api/teacher/blogs/${blogId}/images`);
  },
  uploadBlogImage(blogId: string, file: File) {
    return upload<BlogImageResponse>(`/api/teacher/blogs/${blogId}/images`, file);
  },
  deleteBlogImage(blogId: string, imageId: string) {
    return request<void>(`/api/teacher/blogs/${blogId}/images/${imageId}`, { method: "DELETE" });
  },
  listBlogComments(blogId: string) {
    return request<BlogCommentResponse[]>(`/api/teacher/blogs/${blogId}/comments`);
  },
  createBlogComment(blogId: string, req: BlogCommentRequest) {
    return request<BlogCommentResponse>(`/api/teacher/blogs/${blogId}/comments`, {
      method: "POST",
      body: req,
    });
  },
  updateBlogComment(blogId: string, commentId: string, req: BlogCommentRequest) {
    return request<BlogCommentResponse>(`/api/teacher/blogs/${blogId}/comments/${commentId}`, {
      method: "PUT",
      body: req,
    });
  },
  deleteBlogComment(blogId: string, commentId: string) {
    return request<void>(`/api/teacher/blogs/${blogId}/comments/${commentId}`, {
      method: "DELETE",
    });
  },
  getBlogLikeStatus(blogId: string) {
    return request<ReportLikeStatusResponse>(`/api/teacher/blogs/${blogId}/likes`);
  },
  likeBlog(blogId: string) {
    return request<void>(`/api/teacher/blogs/${blogId}/likes`, { method: "POST" });
  },
  unlikeBlog(blogId: string) {
    return request<void>(`/api/teacher/blogs/${blogId}/likes`, { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminApi = {
  listTeachers() {
    return request<TeacherResponse[]>("/api/admin/teachers");
  },
  getTeacher(id: string) {
    return request<TeacherResponse>(`/api/admin/teachers/${id}`);
  },
  createTeacher(req: TeacherCreateRequest) {
    return request<TeacherResponse>("/api/admin/teachers", { method: "POST", body: req });
  },
  updateTeacher(id: string, req: TeacherUpdateRequest) {
    return request<TeacherResponse>(`/api/admin/teachers/${id}`, { method: "PUT", body: req });
  },
  resetTeacherPassword(id: string, req: PasswordResetRequest) {
    return request<void>(`/api/admin/teachers/${id}/password`, { method: "POST", body: req });
  },
  deleteTeacher(id: string) {
    return request<void>(`/api/admin/teachers/${id}`, { method: "DELETE" });
  },

  listStudents() {
    return request<StudentResponse[]>("/api/admin/students");
  },
  getStudent(id: string) {
    return request<StudentResponse>(`/api/admin/students/${id}`);
  },
  createStudent(req: StudentCreateRequest) {
    return request<StudentResponse>("/api/admin/students", { method: "POST", body: req });
  },
  updateStudent(id: string, req: StudentUpdateRequest) {
    return request<StudentResponse>(`/api/admin/students/${id}`, { method: "PUT", body: req });
  },
  resetStudentPassword(id: string, req: PasswordResetRequest) {
    return request<void>(`/api/admin/students/${id}/password`, { method: "POST", body: req });
  },
  deleteStudent(id: string) {
    return request<void>(`/api/admin/students/${id}`, { method: "DELETE" });
  },

  reportItemGroups: makeReportItemGroupsApi((studentId) => `/api/admin/students/${studentId}`),
  goals: makeGoalsApi((studentId) => `/api/admin/students/${studentId}`),
  goalForms: {
    get(studentId: string, goalId: string) {
      return request<GoalFormResponse>(`/api/admin/students/${studentId}/goal-forms/${goalId}`);
    },
    create(studentId: string, req: GoalFormRequest) {
      return request<GoalFormResponse>(`/api/admin/students/${studentId}/goal-forms`, {
        method: "POST",
        body: req,
      });
    },
    update(studentId: string, goalId: string, req: GoalFormRequest) {
      return request<GoalFormResponse>(`/api/admin/students/${studentId}/goal-forms/${goalId}`, {
        method: "PUT",
        body: req,
      });
    },
  },
  getStudentDashboard(studentId: string) {
    return request<StudentDashboardResponse>(`/api/admin/students/${studentId}/dashboard`);
  },

  listReports(studentId: string) {
    return request<DailyReportListItemResponse[]>(`/api/admin/students/${studentId}/reports`);
  },
  getReport(studentId: string, reportDate: string) {
    return request<DailyReportDetailResponse>(
      `/api/admin/students/${studentId}/reports/${reportDate}`
    );
  },
  listComments(studentId: string, reportDate: string) {
    return request<ReportCommentResponse[]>(
      `/api/admin/students/${studentId}/reports/${reportDate}/comments`
    );
  },
  deleteReport(studentId: string, reportDate: string) {
    return request<void>(`/api/admin/students/${studentId}/reports/${reportDate}`, {
      method: "DELETE",
    });
  },
  deleteReportComment(studentId: string, reportDate: string, commentId: string) {
    return request<void>(
      `/api/admin/students/${studentId}/reports/${reportDate}/comments/${commentId}`,
      { method: "DELETE" }
    );
  },
  listImages(studentId: string, reportDate: string) {
    return request<ReportImageResponse[]>(
      `/api/admin/students/${studentId}/reports/${reportDate}/images`
    );
  },

  listAllBlogs() {
    return request<BlogResponse[]>("/api/admin/blogs");
  },
  getBlog(blogId: string) {
    return request<BlogResponse>(`/api/admin/blogs/${blogId}`);
  },
  listBlogComments(blogId: string) {
    return request<BlogCommentResponse[]>(`/api/admin/blogs/${blogId}/comments`);
  },
  listBlogImages(blogId: string) {
    return request<BlogImageResponse[]>(`/api/admin/blogs/${blogId}/images`);
  },
  deleteBlog(blogId: string) {
    return request<void>(`/api/admin/blogs/${blogId}`, { method: "DELETE" });
  },
  deleteBlogComment(blogId: string, commentId: string) {
    return request<void>(`/api/admin/blogs/${blogId}/comments/${commentId}`, {
      method: "DELETE",
    });
  },
};

// ---------------------------------------------------------------------------
// Shared factories (teacher & admin share identical shapes, differing only
// in base path — admin passes no acting-teacher id on the backend).
// ---------------------------------------------------------------------------

function makeReportItemGroupsApi(basePath: (studentId: string) => string) {
  const groupPath = (studentId: string) => `${basePath(studentId)}/report-item-groups`;
  const subtitlePath = (studentId: string, groupId: string) =>
    `${groupPath(studentId)}/${groupId}/subtitles`;
  const itemPath = (studentId: string, groupId: string, subtitleId: string) =>
    `${subtitlePath(studentId, groupId)}/${subtitleId}/items`;

  return {
    listGroups(studentId: string) {
      return request<ReportItemGroupResponse[]>(groupPath(studentId));
    },
    createGroup(studentId: string, req: ReportItemGroupCreateRequest) {
      return request<ReportItemGroupResponse>(groupPath(studentId), {
        method: "POST",
        body: req,
      });
    },
    deleteGroup(studentId: string, groupId: string) {
      return request<void>(`${groupPath(studentId)}/${groupId}`, { method: "DELETE" });
    },

    listSubtitles(studentId: string, groupId: string) {
      return request<ReportItemSubtitleResponse[]>(subtitlePath(studentId, groupId));
    },
    createSubtitle(studentId: string, groupId: string, req: ReportItemSubtitleCreateRequest) {
      return request<ReportItemSubtitleResponse>(subtitlePath(studentId, groupId), {
        method: "POST",
        body: req,
      });
    },
    updateSubtitle(
      studentId: string,
      groupId: string,
      subtitleId: string,
      req: ReportItemSubtitleUpdateRequest
    ) {
      return request<ReportItemSubtitleResponse>(
        `${subtitlePath(studentId, groupId)}/${subtitleId}`,
        { method: "PUT", body: req }
      );
    },
    deleteSubtitle(studentId: string, groupId: string, subtitleId: string) {
      return request<void>(`${subtitlePath(studentId, groupId)}/${subtitleId}`, {
        method: "DELETE",
      });
    },

    listItems(studentId: string, groupId: string, subtitleId: string) {
      return request<ReportItemDefinitionResponse[]>(itemPath(studentId, groupId, subtitleId));
    },
    createItem(
      studentId: string,
      groupId: string,
      subtitleId: string,
      req: { label: string }
    ) {
      return request<ReportItemDefinitionResponse>(itemPath(studentId, groupId, subtitleId), {
        method: "POST",
        body: req,
      });
    },
    updateItem(
      studentId: string,
      groupId: string,
      subtitleId: string,
      itemId: string,
      req: { label: string }
    ) {
      return request<ReportItemDefinitionResponse>(
        `${itemPath(studentId, groupId, subtitleId)}/${itemId}`,
        { method: "PUT", body: req }
      );
    },
    deleteItem(studentId: string, groupId: string, subtitleId: string, itemId: string) {
      return request<void>(`${itemPath(studentId, groupId, subtitleId)}/${itemId}`, {
        method: "DELETE",
      });
    },
    reorderItems(
      studentId: string,
      groupId: string,
      subtitleId: string,
      req: { orderedIds: string[] }
    ) {
      return request<void>(`${itemPath(studentId, groupId, subtitleId)}/reorder`, {
        method: "PUT",
        body: req,
      });
    },
  };
}

function makeGoalsApi(basePath: (studentId: string) => string) {
  return {
    list(studentId: string) {
      return request<GoalResponse[]>(`${basePath(studentId)}/goals`);
    },
    get(studentId: string, goalId: string) {
      return request<GoalResponse>(`${basePath(studentId)}/goals/${goalId}`);
    },
    create(studentId: string, req: GoalCreateRequest) {
      return request<GoalResponse>(`${basePath(studentId)}/goals`, {
        method: "POST",
        body: req,
      });
    },
    update(studentId: string, goalId: string, req: GoalUpdateRequest) {
      return request<GoalResponse>(`${basePath(studentId)}/goals/${goalId}`, {
        method: "PUT",
        body: req,
      });
    },
    remove(studentId: string, goalId: string) {
      return request<void>(`${basePath(studentId)}/goals/${goalId}`, { method: "DELETE" });
    },
    listProgresses(studentId: string, goalId: string) {
      return request<GoalProgressResponse[]>(`${basePath(studentId)}/goals/${goalId}/progresses`);
    },
    createProgress(studentId: string, goalId: string, req: GoalProgressCreateRequest) {
      return request<GoalProgressResponse>(`${basePath(studentId)}/goals/${goalId}/progresses`, {
        method: "POST",
        body: req,
      });
    },
    updateProgress(
      studentId: string,
      goalId: string,
      progressId: string,
      req: GoalProgressUpdateRequest
    ) {
      return request<GoalProgressResponse>(
        `${basePath(studentId)}/goals/${goalId}/progresses/${progressId}`,
        { method: "PUT", body: req }
      );
    },
    removeProgress(studentId: string, goalId: string, progressId: string) {
      return request<void>(`${basePath(studentId)}/goals/${goalId}/progresses/${progressId}`, {
        method: "DELETE",
      });
    },
  };
}
