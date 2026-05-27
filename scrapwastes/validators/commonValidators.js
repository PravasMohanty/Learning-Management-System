const { z } = require("zod");

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*(),.?":{}|<>]/);

const emailSchema = z.string().email();

const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i);

module.exports = {
  auth: {
    register: z.object({
      body: z.object({
        name: z.string().min(2).max(100),
        email: emailSchema,
        password: passwordSchema,
        phone: z.string().optional(),
        role: z.enum(["student", "instructor"]).optional(),
      }),
    }),
    login: z.object({
      body: z.object({
        email: emailSchema,
        password: z.string().min(1),
      }),
    }),
    refresh: z.object({
      body: z.object({
        refreshToken: z.string(),
      }),
    }),
    forgotPassword: z.object({
      body: z.object({
        email: emailSchema,
      }),
    }),
    resetPassword: z.object({
      body: z.object({
        token: z.string().min(20),
        password: passwordSchema,
      }),
    }),
    verifyEmail: z.object({
      query: z.object({
        token: z.string().min(20),
      }),
    }),
  },

  user: {
    update: z.object({
      body: z.object({
        name: z.string().min(2).max(100).optional(),
        phone: z.string().optional(),
        bio: z.string().max(500).optional(),
        email: emailSchema.optional(),
      }),
    }),
    create: z.object({
      body: z.object({
        name: z.string().min(2).max(100),
        email: emailSchema,
        password: passwordSchema,
        phone: z.string().optional(),
        role: z.enum(["student", "instructor", "admin", "support_agent"]),
      }),
    }),
    list: z.object({
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        role: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    }),
  },

  course: {
    create: z.object({
      body: z.object({
        title: z.string().min(3).max(200),
        description: z.string().min(10).optional(),
        shortDescription: z.string().max(500).optional(),
        category: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        language: z.string().optional(),
        type: z.enum(["recorded", "live", "hybrid"]).optional(),
        pricing: z.object({
          amount: z.number().min(0).optional(),
          currency: z.string().optional(),
        }).optional(),
        outcomes: z.array(z.string()).optional(),
        requirements: z.array(z.string()).optional(),
        targetAudience: z.array(z.string()).optional(),
      }),
    }),
    update: z.object({
      body: z.object({
        title: z.string().min(3).max(200).optional(),
        description: z.string().optional(),
        shortDescription: z.string().max(500).optional(),
        category: z.string().optional(),
        level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        language: z.string().optional(),
        type: z.enum(["recorded", "live", "hybrid"]).optional(),
        pricing: z.object({ amount: z.number().min(0), currency: z.string() }).optional(),
      }),
      params: z.object({
        id: objectIdSchema,
      }),
    }),
    list: z.object({
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
        published: z.string().optional(),
        category: z.string().optional(),
        language: z.string().optional(),
        level: z.string().optional(),
        search: z.string().optional(),
      }),
    }),
  },

  module: {
    create: z.object({
      body: z.object({
        title: z.string().min(2).max(200),
        summary: z.string().optional(),
        order: z.number().optional(),
      }),
      params: z.object({
        courseId: objectIdSchema,
      }),
    }),
    update: z.object({
      body: z.object({
        title: z.string().min(2).max(200).optional(),
        summary: z.string().optional(),
        order: z.number().optional(),
      }),
    }),
  },

  lesson: {
    create: z.object({
      body: z.object({
        title: z.string().min(2).max(200),
        type: z.enum(["video", "quiz", "article"]).optional(),
        summary: z.string().optional(),
        content: z.string().optional(),
        durationSeconds: z.number().optional(),
        isPreview: z.boolean().optional(),
      }),
      params: z.object({
        courseId: objectIdSchema,
        moduleId: objectIdSchema,
      }),
    }),
  },

  quiz: {
    create: z.object({
      body: z.object({
        title: z.string().min(2),
        subtitle: z.string().optional(),
        timeLimitMinutes: z.number().optional(),
        passScore: z.number().min(0).max(100).optional(),
        attemptsAllowed: z.number().min(1).optional(),
        questions: z.array(z.any()).default([]),
      }),
      params: z.object({
        courseId: objectIdSchema,
      }),
    }),
  },

  review: {
    create: z.object({
      body: z.object({
        rating: z.number().min(1).max(5),
        title: z.string().min(5).max(100),
        comment: z.string().min(10).max(1000),
      }),
      params: z.object({
        courseId: objectIdSchema,
      }),
    }),
  },

  ticket: {
    create: z.object({
      body: z.object({
        subject: z.string().min(5).max(200),
        description: z.string().min(10).max(2000),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        category: z.string().optional(),
      }),
    }),
    update: z.object({
      body: z.object({
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
      }),
    }),
    addReply: z.object({
      body: z.object({
        message: z.string().min(1).max(2000),
      }),
    }),
  },

  enrollment: {
    create: z.object({
      params: z.object({
        courseId: objectIdSchema,
      }),
      body: z.object({
        pricePaid: z.number().min(0).optional(),
        currency: z.string().optional(),
      }),
    }),
  },

  progress: {
    markComplete: z.object({
      params: z.object({
        courseId: objectIdSchema,
        lessonId: objectIdSchema,
      }),
    }),
  },

  notification: {
    list: z.object({
      query: z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    }),
  },
};
