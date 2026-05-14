# LMS + WhatsApp Automation Backend

This folder contains the Node.js backend for the Learning Management System. It is a modular Express and MongoDB API that supports authentication, user management, courses, modules, lessons, reviews, progress tracking, quizzes, certificates, tickets, notifications, uploads, admin analytics, WhatsApp campaigns, a WhatsApp inbox/webhook flow, and course chatbot FAQs.

The active server entry point is `server.js`, which loads `app.js`, connects to MongoDB, starts HTTP, initializes Socket.IO, and stores the Socket.IO instance on the Express app with `app.set("io", io)`.

## Tech Stack

- Node.js with CommonJS modules
- Express 5 for the REST API
- MongoDB with Mongoose models
- JWT authentication with access and refresh tokens
- Socket.IO for real-time events
- Multer memory storage for uploads
- Cloudinary for media storage
- Nodemailer for SMTP email
- PDFKit for certificate PDFs
- Zod validation helpers
- express-rate-limit, helmet, cors, cookie-parser, morgan

## Run Locally

1. Install dependencies.

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

3. Start the development server.

```bash
npm run dev
```

4. Check the API health endpoint.

```bash
GET http://localhost:5000/api/health
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Runs `node server.js` for normal startup. |
| `npm run dev` | Runs `nodemon server.js` for development reloads. |
| `npm test` | Runs `node --check server.js`, which syntax-checks the entry file. |

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode. Used by logging, rate limiting, and request logging. |
| `PORT` | API port. Defaults to `5000`. |
| `CLIENT_URL` | Comma-separated allowed CORS origins. Also used by Socket.IO. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_ACCESS_SECRET` | Secret for short-lived access tokens. Required at startup. |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens. Required at startup. |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime. Defaults to `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime. Defaults to `7d`. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `MAX_UPLOAD_MB` | Upload size limit in MB. Defaults to `200`. |
| `SMTP_HOST` | SMTP host for email. If missing, notification email sending is skipped in `notificationService`. |
| `SMTP_PORT` | SMTP port. Defaults to `587`. |
| `SMTP_SECURE` | Whether SMTP uses a secure connection. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASS` | SMTP password. |
| `MAIL_FROM` | Default email sender. |
| `WHATSAPP_VERIFY_TOKEN` | Placeholder for WhatsApp webhook verification support. |

## Request Lifecycle

1. `server.js` connects to MongoDB through `config/db.js`.
2. `server.js` creates an HTTP server from the Express app.
3. `sockets/index.js` attaches Socket.IO to that HTTP server.
4. `app.js` installs global middleware: security headers, CORS, cookies, JSON parsing, URL-encoded parsing, rate limiting, and development logging.
5. `app.js` mounts all `/api/*` route modules.
6. Route modules authenticate users when needed, authorize roles when needed, and call service functions.
7. Services contain most business logic and database work.
8. Mongoose models define the stored documents.
9. `utils/asyncHandler.js` catches async route failures and passes them to `middleware/errorHandler.js`.
10. `middleware/errorHandler.js` converts errors into JSON responses.

## Folder Structure

```text
server/
  app.js                 Express app, global middleware, route mounting
  server.js              Database connection, HTTP server, Socket.IO startup
  config/                MongoDB, Cloudinary, SMTP, and logger setup
  constants/             Shared role/status/string constants
  controllers/           Controller-style modules; currently not mounted by app.js
  helpers/               Small query helpers
  middleware/            Auth, authorization, validation, upload, error, rate-limit middleware
  models/                Mongoose schemas and models
  routes/                Active Express route modules
  services/              Business logic used by the active routes
  sockets/               Socket.IO setup and room handling
  uploads/               Local upload folder placeholder
  utils/                 API error, JWT, response, validation, async helpers
  validators/            Zod request schemas
```

## Entry Files

### `server.js`

`server.js` is the runtime entry point. It imports the Express app, connects MongoDB, creates an HTTP server, initializes Socket.IO, stores the `io` instance on the app, and starts listening on `PORT`.

If database connection or startup fails, the top-level async function catches the error, logs it, and exits the process with code `1`.

### `app.js`

`app.js` builds the Express application.

It installs:

- `helmet()` for basic HTTP security headers.
- `cors()` with `CLIENT_URL` origins and credentials enabled.
- `cookieParser()` so auth tokens can be read from cookies.
- `express.json({ limit: "2mb" })` for JSON request bodies.
- `express.urlencoded({ extended: true })` for form data.
- `apiLimiter` for global API rate limiting.
- `morgan("dev")` outside the test environment.

It exposes `GET /api/health`, mounts all active route modules, adds a 404 JSON fallback, and then adds the central error handler.

## Active Route Map

All paths below are mounted under `/api`.

### Auth: `/api/auth`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/register` | Public | `authService.register` | Creates a user and returns access/refresh tokens. |
| `POST` | `/login` | Public | `authService.login` | Validates credentials, checks active status, updates `lastLoginAt`, and returns tokens. |
| `POST` | `/refresh` | Public | `authService.refresh` | Verifies a refresh token and returns new tokens. |
| `POST` | `/logout` | Authenticated | `authService.logout` | Increments `tokenVersion` so old refresh tokens are invalid. |
| `POST` | `/forgot-password` | Public | `authService.forgotPassword` | Creates a reset token and emails it. |
| `POST` | `/reset-password` | Public | `authService.resetPassword` | Validates reset token and changes password. |
| `GET` | `/me` | Authenticated | Inline route | Returns the authenticated user from `req.user`. |

### Users: `/api/users`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/` | Admin | `userService.listUsers` | Lists users with pagination, role/status filters, and search. |
| `GET` | `/me` | Authenticated | Inline route | Returns the current authenticated user. |
| `POST` | `/` | Admin | `userService.createUser` | Creates a user manually. |
| `PUT` | `/me` | Authenticated | `userService.updateUser` | Updates the current user profile. |
| `PUT` | `/:id` | Admin | `userService.updateUser` | Updates any user. |
| `DELETE` | `/:id` | Admin | `userService.deleteUser` | Soft-deletes a user by setting status to `deleted`. |
| `PUT` | `/:id/suspend` | Admin | `userService.suspendUser` | Suspends a user and increments `tokenVersion`. |

### Admin: `/api/admin`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/dashboard` | Admin | `dashboardService.adminDashboard` | Returns students, instructors, courses, enrollments, revenue, tickets, WhatsApp counts, pending users, and recent tickets. |
| `GET` | `/analytics` | Admin | `dashboardService.courseAnalytics` | Returns top course analytics sorted by enrollment count. |

### Courses: `/api/courses`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/` | Public | `courseService.listCourses` | Lists courses with filters and pagination. |
| `POST` | `/` | Admin/Instructor | `courseService.createCourse` | Creates a course and assigns the authenticated user as instructor. |
| `GET` | `/:id` | Public | `courseService.getCourseDetail` | Fetches a course by id or slug with curriculum and reviews. |
| `PUT` | `/:id` | Admin/Instructor | `courseService.updateCourse` | Updates course fields. |
| `DELETE` | `/:id` | Admin/Instructor | `courseService.deleteCourse` | Deletes a course. |
| `POST` | `/:id/publish` | Admin/Instructor | `courseService.publishCourse` | Sets published state and published timestamp. |
| `POST` | `/:id/enroll` | Authenticated | `courseService.enroll` | Creates an enrollment if one does not already exist. |
| `POST` | `/:id/comment` | Authenticated | `courseService.addComment` | Adds a comment to a lesson. The route passes `:id` into the lesson comment service. |

### Modules: `/api/modules`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Admin/Instructor | `courseService.createModule` | Creates a course module. |
| `PUT` | `/:id` | Admin/Instructor | `courseService.updateModule` | Updates a module. |
| `DELETE` | `/:id` | Admin/Instructor | `courseService.deleteModule` | Deletes a module. |

### Lessons: `/api/lessons`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Admin/Instructor | `courseService.createLesson` | Creates a lesson. |
| `PUT` | `/:id` | Admin/Instructor | `courseService.updateLesson` | Updates a lesson. |
| `DELETE` | `/:id` | Admin/Instructor | `courseService.deleteLesson` | Deletes a lesson. |
| `POST` | `/:id/comment` | Authenticated | `courseService.addComment` | Adds a comment to the lesson. |

### Reviews: `/api/reviews`

| Method | Path | Access | Model | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/` | Public | `Review` | Finds reviews using the query string as a Mongo filter and sorts newest first. |
| `POST` | `/` | Authenticated | `Review` | Creates a review for the current student. |
| `PUT` | `/:id/approve` | Admin/Instructor | `Review` | Marks a review as approved. |

### Progress: `/api/progress`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/dashboard` | Authenticated | `progressService.getStudentDashboard` | Returns student stats, enrolled courses, progress, and certificates. |
| `GET` | `/course/:courseId` | Authenticated | `progressService.getCourseProgress` | Returns one student's progress for a course. |
| `POST` | `/lesson` | Authenticated | `progressService.markLesson` | Marks a lesson complete, updates watch time and percentage, and emits `progress:updated`. |

### Quizzes: `/api/quizzes`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Admin/Instructor | `quizService.createQuiz` | Creates a quiz. |
| `PUT` | `/:id` | Admin/Instructor | `quizService.updateQuiz` | Updates a quiz. |
| `GET` | `/` | Public | `quizService.listQuizzes` | Lists quizzes, optionally by course. |
| `GET` | `/:id` | Public | `quizService.getQuiz` | Fetches a quiz. |
| `POST` | `/:id/attempt` | Authenticated | `quizService.submitAttempt` | Grades answers, stores an attempt, and may mark the quiz lesson complete. |

### Tickets: `/api/tickets`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Authenticated | `ticketService.createTicket` | Creates a support ticket and emits `ticket:new`. |
| `GET` | `/` | Authenticated | `ticketService.listTickets` | Lists tickets, optionally by status. |
| `GET` | `/:id` | Authenticated | `ticketService.getTicket` | Returns a ticket and its replies. |
| `POST` | `/:id/reply` | Authenticated | `ticketService.reply` | Adds a reply and emits `ticket:reply` to the ticket room. |
| `PATCH` | `/:id/status` | Admin/Instructor | `ticketService.setStatus` | Updates ticket status and emits `ticket:updated`. |

### Campaigns and WhatsApp: `/api/campaigns`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Admin | `whatsappService.createCampaign` | Creates a WhatsApp campaign. |
| `GET` | `/` | Admin | `whatsappService.listCampaigns` | Lists campaigns newest first. |
| `POST` | `/:id/send` | Admin | `whatsappService.sendCampaign` | Creates outbound WhatsApp message records for campaign leads and emits `whatsapp:campaign:updated`. |
| `POST` | `/webhook` | Public | `whatsappService.webhook` | Stores inbound WhatsApp messages, upserts leads, and emits `whatsapp:inbox:new`. |
| `GET` | `/analytics` | Admin | `whatsappService.analytics` | Returns lead, campaign, message, and unread inbound counts. |

### Chatbot: `/api/chatbot`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/course/:id` | Admin/Instructor | `chatbotService.setCourseChatbot` | Stores chatbot settings on a course. |
| `POST` | `/answer` | Public | `chatbotService.answer` | Looks for a matching FAQ question and returns an answer. |

### Notifications: `/api/notifications`

| Method | Path | Access | Service/Model | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/` | Authenticated | `Notification` | Lists notifications for the current user. |
| `POST` | `/` | Authenticated | `notificationService.createNotification` | Creates a notification and emits `notification:new` to the user room. |

### Uploads: `/api/upload`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Public in current route | `uploadService.uploadBuffer` | Accepts one `file` field through Multer and uploads it to Cloudinary. |
| `DELETE` | `/` | Public in current route | `uploadService.deleteMedia` | Deletes a Cloudinary asset by `publicId` and `resourceType`. |

### Certificates: `/api/certificates`

| Method | Path | Access | Service | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/issue` | Admin/Instructor | `certificateService.issue` | Marks enrollment complete and creates a certificate if one does not already exist. |
| `GET` | `/verify/:verificationId` | Public | `certificateService.verify` | Looks up a certificate by verification id. |
| `GET` | `/download/:id` | Public | `certificateService.streamPdf` | Streams a generated PDF certificate to the response. |

## Services

The services contain the code that routes call directly.

### `services/authService.js`

Handles registration, login, refresh, logout, forgot password, and reset password.

- `register(data)` creates a `User` and immediately signs access and refresh tokens.
- `login({ email, password })` loads the user with `+password`, compares bcrypt password, rejects non-active accounts, updates `lastLoginAt`, and returns tokens.
- `refresh(token)` verifies a refresh token and checks `tokenVersion` against the user document.
- `logout(user)` increments `tokenVersion`, invalidating existing refresh tokens.
- `forgotPassword(email)` creates a random reset token, stores a SHA-256 hash on the user, emails the raw token, and returns the raw token.
- `resetPassword({ token, password })` hashes the provided token, finds a non-expired reset record, sets the new password, clears reset fields, and increments `tokenVersion`.

### `services/userService.js`

Handles admin and profile user operations.

- Lists users with pagination, role/status filters, and escaped regex search.
- Creates users.
- Updates users with Mongoose validators.
- Soft-deletes users by setting `status: "deleted"`.
- Suspends users by setting `status: "suspended"` and incrementing `tokenVersion`.
- Imports users from CSV buffers with `csv-parse/sync`.
- Exposes a CSV template string.

### `services/courseService.js`

Handles courses, modules, lessons, enrollment, and lesson comments.

- Creates course slugs with `slugify`.
- Lists courses with filters for published state, category, language, type, and search.
- Fetches course details by slug or Mongo id and builds a curriculum from modules and published lessons.
- Updates/deletes/publishes courses.
- Creates, updates, and deletes modules and lessons.
- Enrolls students with duplicate-enrollment protection and increments `stats.enrolledCount`.
- Adds comments to lessons.

### `services/dashboardService.js`

Builds admin-facing analytics.

- Counts active students and instructors.
- Counts courses, enrollments, WhatsApp messages, and campaigns.
- Computes revenue from enrollment `pricePaid`.
- Aggregates ticket counts by status.
- Returns pending users and recent tickets.
- Returns course analytics sorted by enrollment count.

### `services/progressService.js`

Tracks student learning progress.

- `getStudentDashboard(student)` returns enrolled courses, progress records, certificates, and summary stats.
- `getCourseProgress(student, course)` returns one progress record with populated lessons.
- `markLesson({ student, course, lesson, watchSeconds }, io)` creates or updates progress, appends a completed lesson if needed, updates watch time, calculates percentage from published lessons, saves the document, and emits `progress:updated`.

### `services/quizService.js`

Handles quiz authoring and attempts.

- Creates and updates quizzes.
- Lists quizzes globally or for a course.
- Fetches a quiz by id.
- Scores submitted answers by comparing `selectedOption` with the option marked `isCorrect`.
- Stores a `QuizAttempt` with score, percentage, pass status, and checked answers.
- If the attempt passes and the quiz is attached to a lesson, it marks that lesson complete through `progressService.markLesson`.

### `services/ticketService.js`

Handles support tickets.

- Creates tickets and emits `ticket:new`.
- Lists tickets and populates `user` and `assignedTo`.
- Fetches a ticket with replies.
- Creates replies and emits `ticket:reply` to the ticket room.
- Updates status, adds `resolvedAt` or `closedAt` when appropriate, and emits `ticket:updated`.

### `services/whatsappService.js`

Handles WhatsApp lead, campaign, and inbound message logic.

- Imports leads from CSV buffers.
- Creates and lists campaigns.
- Sends campaigns by creating outbound `WhatsAppMessage` documents for each campaign lead.
- Marks campaign status as `running`, then `completed`.
- Stores inbound webhook payloads, upserts a lead by phone, and emits `whatsapp:inbox:new`.
- Calculates simple analytics counts for leads, campaigns, messages, and unread inbound messages.

### `services/chatbotService.js`

Stores and answers simple course FAQ chatbot data.

- `setCourseChatbot(courseId, data)` updates the `chatbot` object on a course.
- `answer({ courseId, message })` checks if the course chatbot is enabled, finds a FAQ whose question appears in the message, and returns either the FAQ answer or a fallback response.

### `services/certificateService.js`

Handles certificate issuing, verification, and PDF streaming.

- `issue({ student, course, metadata })` reuses an existing certificate if present.
- Marks the matching enrollment as completed.
- Creates a certificate with an uppercase random verification id.
- `verify(verificationId)` finds and populates a certificate.
- `streamPdf(certificateId, res)` uses PDFKit to stream a generated A4 certificate PDF directly to the HTTP response.

### `services/uploadService.js`

Uploads and deletes media through Cloudinary.

- `uploadBuffer(file, folder)` detects video files, opens a Cloudinary upload stream, pipes the Multer memory buffer into it, and returns URL, public id, resource type, original name, and byte size.
- `deleteMedia(publicId, resourceType)` destroys a Cloudinary asset when a public id is provided.

### `services/notificationService.js`

Handles in-app notifications and lightweight email sending.

- `createNotification(user, payload, io)` creates a `Notification` and emits `notification:new` to the user room.
- `sendEmail({ to, subject, html, text })` sends through `config/mail.js` when SMTP is configured, otherwise returns `{ skipped: true }`.

### `services/emailService.js`

Provides a more detailed Nodemailer wrapper and email templates.

- Initializes and verifies an SMTP transporter.
- Sends generic email.
- Sends verification, password reset, welcome, and enrollment-confirmation emails.

In the current active route flow, `authService.js` imports `sendEmail` from `notificationService.js`, while `emailService.js` is available for richer templated email flows.

### `services/passwordService.js`

Provides password helpers.

- `checkPasswordStrength(password)` calculates weak/fair/good/strong labels.
- `validatePassword(password)` checks minimum length, uppercase, number, and special character requirements.
- `hashPassword(password)` hashes with bcrypt cost `12`.
- `comparePassword(password, hash)` compares a plain password with a bcrypt hash.

## Models

### `User`

Represents platform users.

Important fields:

- `name`, `email`, `phone`, `password`
- `role`: `admin`, `instructor`, `student`, `support_agent`
- `avatar`, `bio`
- `status`: `pending`, `active`, `suspended`, `deleted`
- `approvedAt`, `lastLoginAt`
- `tokenVersion` for refresh-token invalidation
- password reset fields
- notification and WhatsApp preferences

The model hashes passwords before save and defines `comparePassword(password)`.

### `Course`

Represents a course.

Important fields:

- content fields: `title`, `slug`, `shortDescription`, `description`, `category`, `level`, `language`, `type`
- ownership: `instructor`
- media: `thumbnail`, `preview`
- pricing: `amount`, `currency`, `discountPrice`
- publishing: `isPublished`, `publishedAt`, `enrollmentOpen`
- chatbot: `enabled`, `filters`, `faq`
- stats: average rating, rating count, enrolled count, revenue
- learning metadata: outcomes, requirements, target audience

It has text indexing for title, description, and category.

### `Module`

Represents a section inside a course.

Important fields:

- `course`
- `title`
- `summary`
- `order`
- `isPublished`

It is indexed by course and order.

### `Lesson`

Represents a course lesson.

Important fields:

- `course`, `module`
- `type`: `video`, `quiz`, or `article`
- `title`, `summary`, `order`, `durationSeconds`
- `video`, `notes`, `resources`
- `isPreview`, `isPublished`
- embedded `comments`

The shared media subdocument stores URL, Cloudinary public id, resource type, original name, and byte size.

### `Enrollment`

Connects a student to a course.

Important fields:

- `student`, `course`
- `status`: `active`, `completed`, `cancelled`, `refunded`
- `pricePaid`, `currency`
- `enrolledAt`, `completedAt`

It enforces one enrollment per student/course pair with a unique compound index.

### `Progress`

Stores a student's progress in a course.

Important fields:

- `student`, `course`
- `completedLessons`
- `lastLesson`
- `percentage`
- `watchSeconds`
- `notes`

It enforces one progress document per student/course pair.

### `Quiz`

Represents a quiz attached to a course, module, and optionally lesson.

Important fields:

- `course`, `module`, `lesson`
- `title`, `subtitle`
- `timeLimitMinutes`
- `passScore`
- `attemptsAllowed`
- `questions`
- `isPublished`

Each question has text, type, options, points, and explanation.

### `QuizAttempt`

Stores one student's submitted quiz attempt.

Important fields:

- `quiz`, `student`, `course`
- checked `answers`
- `score`, `percentage`, `passed`
- `startedAt`, `submittedAt`

### `Review`

Stores student reviews for courses.

Important fields:

- `course`, `student`
- `rating`, `title`, `comment`
- `approved`

It enforces one review per student/course pair.

### `Ticket`

Represents support tickets.

Important fields:

- generated `ticketNo`
- `user`, `assignedTo`
- `subject`, `description`
- `status`: `open`, `in_progress`, `resolved`, `closed`
- `priority`: `low`, `medium`, `high`, `urgent`
- `category`, `attachments`
- `resolvedAt`, `closedAt`

Before validation, it generates a human-readable ticket number if one is missing.

### `TicketReply`

Represents replies on support tickets.

Important fields:

- `ticket`, `user`
- `message`
- `attachments`
- `internal`

### `Notification`

Stores in-app notifications.

Important fields:

- `user`
- `title`, `message`
- `type`: `info`, `success`, `warning`, `ticket`, `course`, `certificate`, `whatsapp`
- `readAt`
- `data`

### `Certificate`

Stores issued course certificates.

Important fields:

- `student`, `course`
- unique `verificationId`
- `title`
- `issuedAt`
- optional PDF media reference
- metadata for PDF heading/footer

### `Lead`

Stores WhatsApp/contact leads.

Important fields:

- `name`, unique `phone`, `email`
- `tags`
- `source`
- `status`: `new`, `subscribed`, `unsubscribed`, `bounced`
- `customFields`
- `importedBy`

### `Campaign`

Stores WhatsApp campaigns.

Important fields:

- `name`
- `messageTemplate`
- optional media
- `targetTags`
- `leads`
- `status`: `draft`, `scheduled`, `running`, `completed`, `failed`
- `scheduledAt`, `sentAt`
- stats: queued, sent, delivered, read, failed, replies
- `createdBy`

### `WhatsAppMessage`

Stores inbound and outbound WhatsApp-style messages.

Important fields:

- `lead`, `campaign`
- `direction`: `inbound` or `outbound`
- `from`, `to`, `body`, media
- `providerMessageId`
- `status`: `queued`, `sent`, `delivered`, `read`, `failed`, `received`
- `assignedTo`
- `chatbotHandled`
- raw provider payload

## Middleware

### `middleware/auth.js`

Provides authentication and authorization.

- `authenticate` reads a bearer token from `Authorization` or an `accessToken` cookie.
- It verifies the JWT, loads the user, checks that the account is active, and stores the user on `req.user`.
- `authorize(...roles)` checks `req.user.role`.
- `requireOwnership(resourceUserId)` allows access to owners or admins.

### `middleware/errorHandler.js`

Normalizes errors into JSON.

It handles:

- Mongo duplicate key errors as `409`
- Mongoose validation errors as `422`
- Mongoose cast errors as `400`
- JWT errors as `401`
- custom `ApiError` status codes

It logs warnings for client errors and errors for server failures.

### `middleware/rateLimiter.js`

Defines three rate limiters:

- `authLimiter`: 50 requests per 15 minutes.
- `apiLimiter`: 500 requests per 15 minutes. This is mounted globally in `app.js`.
- `uploadLimiter`: 50 requests per hour.

All rate limiters skip enforcement in the test environment.

### `middleware/upload.js`

Configures Multer with memory storage.

Allowed file types:

- JPEG, PNG, WebP
- MP4, WebM
- PDF
- CSV / Excel MIME
- ZIP

The max file size uses `MAX_UPLOAD_MB`.

### `middleware/validate.js`

Wraps a Zod schema around the request. It validates `body`, `query`, and `params`, replaces those objects with parsed data, and raises a `422` `ApiError` on failure.

The validator helper exists, but the current active route files do not mount these schemas yet.

## Config

### `config/db.js`

Connects Mongoose to `MONGO_URI` or the local default database. It logs `"MongoDB connected"` after a successful connection.

### `config/cloudinary.js`

Configures and exports `cloudinary.v2` using Cloudinary environment variables.

### `config/mail.js`

Creates and returns a Nodemailer transporter using SMTP environment variables.

### `config/logger.js`

Provides JSON-style `info`, `warn`, `error`, and `debug` logging.

- In development, logs print to the console.
- In production, app logs are appended to `logs/app.log`.
- Error logs are appended to `logs/error.log`.

## Utilities and Helpers

### `utils/ApiError.js`

Custom `Error` subclass with `statusCode` and optional `details`.

### `utils/asyncHandler.js`

Wraps async Express handlers so rejected promises go to `next(err)`.

### `utils/jwt.js`

Signs and verifies access and refresh tokens.

- Access token payload: user id, role, email.
- Refresh token payload: user id and token version.
- Throws a startup error if JWT secrets are missing.

### `utils/response.js`

Defines an `ApiResponse` class with `success`, `statusCode`, `message`, optional `data`, and optional `meta`.

### `utils/validation.js`

Provides simple validation helpers for ObjectIds, emails, URLs, and phone numbers.

### `helpers/query.js`

Provides:

- `pageParams(query)` for bounded pagination.
- `searchRegex(value)` for escaped case-insensitive regex search.

### `validators/commonValidators.js`

Defines Zod schemas for auth, user, course, module, lesson, quiz, review, ticket, enrollment, progress, and notification requests.

These schemas are ready to use with `middleware/validate.js`, but the current route files do not yet apply them.

## Constants

### `constants/index.js`

Exports role names, user statuses, course levels/types, enrollment statuses, lesson types, ticket statuses/priorities, certificate statuses, password strength labels, common HTTP status codes, pagination defaults, rate-limit defaults, and JWT expiry defaults.

### `constants/roles.js`

Exports smaller frozen role, ticket status, and campaign status objects.

## Sockets

Socket.IO is initialized in `sockets/index.js`.

### Authentication

The socket middleware reads `socket.handshake.auth.token`. If a token is present and valid, it stores the JWT payload on `socket.user` and joins a user-specific room named by the user id.

Invalid socket tokens do not reject the connection in the current implementation; the socket continues without a user room.

### Client Events

| Event | What it does |
| --- | --- |
| `ticket:join` | Joins a room named by the ticket id. |
| `course:join` | Joins a room named `course:<id>`. |
| `inbox:join` | Joins the `whatsapp:inbox` room. |

### Server Events

| Event | Emitted by | Purpose |
| --- | --- | --- |
| `notification:new` | `notificationService.createNotification` | Sends a new notification to one user room. |
| `progress:updated` | `progressService.markLesson` | Sends updated progress to one student room. |
| `ticket:new` | `ticketService.createTicket` | Broadcasts a new support ticket. |
| `ticket:reply` | `ticketService.reply` | Sends a new reply to a ticket room. |
| `ticket:updated` | `ticketService.setStatus` | Broadcasts ticket status changes. |
| `whatsapp:inbox:new` | `whatsappService.webhook` | Broadcasts a new inbound WhatsApp message. |
| `whatsapp:campaign:updated` | `whatsappService.sendCampaign` | Broadcasts campaign send completion/status updates. |

## Controllers Folder

The `controllers/` directory contains controller-style modules for admin, auth, certificates, courses, enrollment, lessons, modules, notifications, progress, quizzes, reviews, tickets, and users.

In the current active application, `app.js` mounts `routes/*`, and those routes call `services/*` directly. That means the controller files are not currently part of the live request path unless a route is changed to import and use them.

Use the controllers as reference code or as a future refactor target if you want the backend to follow this shape:

```text
route -> controller -> service -> model
```

The active shape today is:

```text
route -> service -> model
```

## Data Relationships

- A `User` can be an admin, instructor, student, or support agent.
- A `Course` belongs to an instructor.
- A `Course` has many `Module` documents.
- A `Module` has many `Lesson` documents.
- A `Student` enrolls in a `Course` through `Enrollment`.
- `Progress` stores one student/course progress record.
- `Quiz` belongs to a course and can be attached to a module or lesson.
- `QuizAttempt` belongs to a quiz, student, and course.
- `Review` belongs to a course and student.
- `Ticket` belongs to a user and has many `TicketReply` documents.
- `Certificate` belongs to a student and course.
- `Campaign` targets many `Lead` documents.
- `WhatsAppMessage` can belong to a lead and campaign.
- `Notification` belongs to a user.

## Authentication and Authorization

Protected routes use `authenticate`. Role-protected routes also use `authorize(...)`.

Typical request header:

```http
Authorization: Bearer <access-token>
```

The middleware can also read an `accessToken` cookie.

Refresh tokens include `tokenVersion`. When a user logs out or is suspended, `tokenVersion` increments. Any old refresh token with the previous version becomes invalid.

## Standard Error Format

Most errors return:

```json
{
  "success": false,
  "message": "Error message"
}
```

Validation errors can include:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": {}
}
```

In development, server errors can include a stack trace.

## Common Response Shapes

Paginated list services usually return:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

Auth services return:

```json
{
  "user": {},
  "accessToken": "...",
  "refreshToken": "..."
}
```

## Notes for Future Maintenance

- `validators/commonValidators.js` and `middleware/validate.js` are ready, but most active route files currently do not use request validation.
- `authLimiter` and `uploadLimiter` are defined, but only `apiLimiter` is mounted globally in `app.js`.
- `uploadRoutes.js` is public in the current implementation. Add `authenticate` and role checks if uploads should be restricted.
- `certificateRoutes.js` allows public PDF downloads by certificate id. Verification is public by design, but direct id downloads may need access rules depending on product requirements.
- `controllers/` contains code that is not in the active `app.js` request path.
- Some services include broader helper functions than the active routes expose, such as CSV import and richer email templates.
