const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Get token from localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - token expired, try to refresh
    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem("access_token", refreshData.data.access_token);
          localStorage.setItem("refresh_token", refreshData.data.refresh_token);

          // Retry original request with new token
          headers.Authorization = `Bearer ${refreshData.data.access_token}`;
          return fetch(url, { ...options, headers }).then((res) =>
            res.json()
          );
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/auth/login";
        }
      }
    }

    return await response.json();
  } catch (error) {
    console.error("[API Error]", error);
    throw error;
  }
};

export const apiDownload = async (endpoint, filename, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = { ...options.headers };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem("access_token", refreshData.data.access_token);
          localStorage.setItem("refresh_token", refreshData.data.refresh_token);

          headers.Authorization = `Bearer ${refreshData.data.access_token}`;
          response = await fetch(url, { ...options, headers });
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/auth/login";
          return;
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to download file");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("[Download Error]", error);
    throw error;
  }
};

// ============================================================
// AUTH APIs
// ============================================================

export const authAPI = {
  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiCall("/auth/logout", {
      method: "POST",
    }),

  refresh: (refreshToken) =>
    apiCall("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  registerAdmin: (name, email, password, adminCode) =>
    apiCall("/auth/register-admin", {
      method: "POST",
      body: JSON.stringify({ name, email, password, adminCode }),
    }),

  registerStudent: (name, email) =>
    apiCall("/auth/register-student-request", {
      method: "POST",
      body: JSON.stringify({ name, email }),
    }),

  forgotPassword: (email, otp = null, newPassword = null) =>
    apiCall("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  changePassword: (newPassword) =>
    apiCall("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    }),
};

// ============================================================
// COURSE APIs
// ============================================================

export const courseAPI = {
  getAll: () =>
    apiCall("/courses", { method: "GET" }),

  getById: (courseId) =>
    apiCall(`/courses/${courseId}`, { method: "GET" }),

  create: (courseData) =>
    apiCall("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    }),

  update: (courseId, courseData) =>
    apiCall(`/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(courseData),
    }),

  delete: (courseId) =>
    apiCall(`/courses/${courseId}`, { method: "DELETE" }),

  publish: (courseId) =>
    apiCall(`/courses/${courseId}/publish`, { method: "PUT" }),
};

// ============================================================
// MODULE APIs
// ============================================================

export const moduleAPI = {
  getByCourseId: (courseId) =>
    apiCall(`/modules/course/${courseId}`, { method: "GET" }),

  create: (courseId, moduleData) =>
    apiCall(`/modules/${courseId}`, {
      method: "POST",
      body: JSON.stringify(moduleData),
    }),

  update: (moduleId, moduleData) =>
    apiCall(`/modules/${moduleId}`, {
      method: "PUT",
      body: JSON.stringify(moduleData),
    }),

  delete: (moduleId) =>
    apiCall(`/modules/${moduleId}`, { method: "DELETE" }),
};

// ============================================================
// ASSIGNMENT APIs
// ============================================================

export const assignmentAPI = {
  getAll: (courseId) =>
    apiCall(`/assignments/course/${courseId}`, { method: "GET" }),

  getById: (assignmentId) =>
    apiCall(`/assignments/${assignmentId}`, { method: "GET" }),

  create: (assignmentData) =>
    apiCall("/assignments", {
      method: "POST",
      body: JSON.stringify(assignmentData),
    }),

  update: (assignmentId, assignmentData) =>
    apiCall(`/assignments/${assignmentId}`, {
      method: "PUT",
      body: JSON.stringify(assignmentData),
    }),

  delete: (assignmentId) =>
    apiCall(`/assignments/${assignmentId}`, { method: "DELETE" }),

  submit: (assignmentId, submissionData) =>
    apiCall(`/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(submissionData),
    }),

  getSubmissions: (assignmentId) =>
    apiCall(`/assignments/${assignmentId}/submissions`, { method: "GET" }),

  gradeSubmission: (submissionId, gradeData) =>
    apiCall(`/assignments/submission/${submissionId}/grade`, {
      method: "PUT",
      body: JSON.stringify(gradeData),
    }),
};

// ============================================================
// USER APIs
// ============================================================

export const userAPI = {
  getProfile: () =>
    apiCall("/users/profile/me", { method: "GET" }),

  getProfileById: (userId) =>
    apiCall(`/users/profile/${userId}`, { method: "GET" }),

  getAll: () =>
    apiCall("/users", { method: "GET" }),

  lockAccount: (userId) =>
    apiCall(`/users/${userId}/lock`, { method: "PUT" }),

  unlockAccount: (userId) =>
    apiCall(`/users/${userId}/unlock`, { method: "PUT" }),

  delete: (userId) =>
    apiCall(`/users/${userId}`, { method: "DELETE" }),
};

// ============================================================
// BULK USER APIs
// ============================================================

export const bulkUserAPI = {
  downloadTemplate: () =>
    apiDownload("/bulk-users/template/download", "student_upload_template.csv", {
      method: "GET",
    }),

  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return fetch(`${API_BASE_URL}/bulk-users/upload-csv`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    }).then((res) => res.json());
  },
};

// ============================================================
// REQUEST APIs
// ============================================================

export const requestAPI = {
  getAll: () =>
    apiCall("/requests/view-all", { method: "GET" }),

  approve: (requestId) =>
    apiCall(`/requests/${requestId}/approve`, { method: "PUT" }),

  reject: (requestId, rejectionReason = "") =>
    apiCall(`/requests/${requestId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ rejectionReason }),
    }),
};

// ============================================================
// QUIZ APIs
// ============================================================

export const quizAPI = {
  createFromCSV: (moduleId, quizData, csvFile) => {
    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("title", quizData.title);
    if (quizData.description) formData.append("description", quizData.description);
    if (quizData.pass_percentage) formData.append("pass_percentage", quizData.pass_percentage);
    if (quizData.time_limit) formData.append("time_limit", quizData.time_limit);

    return fetch(`${API_BASE_URL}/quiz/${moduleId}/create-from-csv`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    }).then((res) => res.json());
  },
};

// ============================================================
// PROGRESS APIs
// ============================================================

export const progressAPI = {
  getMyProgress: () =>
    apiCall("/progress", { method: "GET" }),

  getCourseProgress: (courseId) =>
    apiCall(`/progress/${courseId}`, { method: "GET" }),

  initialize: (courseId) =>
    apiCall(`/progress/${courseId}`, { method: "POST" }),

  update: (courseId, progress) =>
    apiCall(`/progress/${courseId}`, {
      method: "PUT",
      body: JSON.stringify({ progress }),
    }),
};

// ============================================================
// CERTIFICATE APIs
// ============================================================

export const certificateAPI = {
  getMyCertificates: () =>
    apiCall("/certificates/my", { method: "GET" }),

  getAllCertificates: () =>
    apiCall("/certificates/all", { method: "GET" }),

  getById: (id) =>
    apiCall(`/certificates/${id}`, { method: "GET" }),

  download: (id) =>
    apiCall(`/certificates/${id}/download`, { method: "GET" }),

  generate: (courseId) =>
    apiCall(`/certificates/${courseId}/generate`, { method: "POST" }),
};

// ============================================================
// DISCUSSION APIs
// ============================================================

export const discussionAPI = {
  getCourseDiscussions: (courseId, params = {}) => {
    const query = new URLSearchParams();
    if (params.module_id) query.set("module_id", params.module_id);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    const qs = query.toString();
    return apiCall(`/discussions/course/${courseId}${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  getById: (discussionId) =>
    apiCall(`/discussions/${discussionId}`, { method: "GET" }),

  create: (data) =>
    apiCall("/discussions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (discussionId, data) =>
    apiCall(`/discussions/${discussionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (discussionId) =>
    apiCall(`/discussions/${discussionId}`, { method: "DELETE" }),

  addReply: (discussionId, body) =>
    apiCall(`/discussions/${discussionId}/replies`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  deleteReply: (replyId) =>
    apiCall(`/discussions/replies/${replyId}`, { method: "DELETE" }),

  markResolved: (discussionId) =>
    apiCall(`/discussions/${discussionId}/resolve`, { method: "PUT" }),

  toggleLock: (discussionId) =>
    apiCall(`/discussions/${discussionId}/lock`, { method: "PUT" }),
};
