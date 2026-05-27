module.exports = {
  ROLES: {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    STUDENT: 'student',
    SUPPORT_AGENT: 'support_agent',
  },

  USER_STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
  },

  COURSE_LEVELS: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  },

  COURSE_TYPES: {
    RECORDED: 'recorded',
    LIVE: 'live',
    HYBRID: 'hybrid',
  },

  ENROLLMENT_STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },

  LESSON_TYPES: {
    VIDEO: 'video',
    QUIZ: 'quiz',
    ARTICLE: 'article',
  },

  TICKET_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
  },

  TICKET_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },

  CERTIFICATE_STATUS: {
    ISSUED: 'issued',
    REVOKED: 'revoked',
  },

  PASSWORD_STRENGTH: {
    WEAK: 'weak',
    FAIR: 'fair',
    GOOD: 'good',
    STRONG: 'strong',
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  RATE_LIMIT: {
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX: 50,
    API_WINDOW_MS: 15 * 60 * 1000,
    API_MAX: 500,
  },

  JWT: {
    ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};
