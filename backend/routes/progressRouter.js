router.post(
  "/:courseId/lesson/:lessonId/complete",
  authMiddleware,
  markLessonComplete
);

router.delete(
  "/:courseId/lesson/:lessonId/complete",
  authMiddleware,
  markLessonIncomplete
);

router.get(
  "/:courseId",
  authMiddleware,
  getCourseProgress
);

router.get(
  "/",
  authMiddleware,
  getMyProgress
);

router.post(
  "/:courseId/recalculate",
  authMiddleware,
  recalculateProgress
);

