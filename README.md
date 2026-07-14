# Enterprise Task Management System (MERN Stack)

Production-ready task management, tracking, and reporting environment using MongoDB, Express.js, React (Vite), Node.js, Socket.IO, Nodemailer, jsPDF, and Recharts.

---

## Technical Features

1. **Role-Based Access Control**:
   - **Admin**: Full access. User management, role edits, user activation controls.
   - **Manager**: Create, edit, delete tasks. View weekly reports, analytics, performance rankings.
   - **Employee**: Checklist view of assigned tasks, update status (Pending, In Progress, Completed), write comments, attach documents.
2. **Double-JWT Authentication**:
   - Short-lived Access Token in Request Headers (15 min).
   - Long-lived Refresh Token in Secure, HTTP-Only Cookie (7 days) with automated silent token rotation.
   - Google One-Tap/Identity Login.
3. **Analytics Dashboard**:
   - Metrics cards (Completed, Overdue, Productive score).
   - Recharts visual graphs (Pie status, Weekly performance, Monthly area timeline, Department bars, Completion growth line).
4. **Export Engines**:
   - **PDF**: Company header design, metadata statistics, and autotables of leaderboard positions.
   - **Excel**: Multi-tab workbook (`Leaderboard` and `Tasks Log`) download.
5. **Real-time Engine**:
   - Socket.IO connection binds users to distinct rooms to pipe comments and notification cards instantly.
6. **Automatic Cron Schedules**:
   - Daily morning alerts for tasks due today.
   - Daily morning warnings for overdue items.
   - Friday evening weekly email digests.
7. **Security Checks**:
   - Helmet header guards, Mongo injection query sanitization, Express rate-limiters, input validations, Bcrypt hashes, and custom CORS headers.

---

## Installation & Setup

### Prerequisites
- Node.js installed locally.
- MongoDB server running locally or a MongoDB Atlas URI.

### 1. Backend Configuration
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create your `.env` file (copied from `.env.example`):
   ```ini
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/enterprise_task_manager
   JWT_ACCESS_SECRET=your_jwt_access_secret_here_must_be_strong
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_must_be_strong
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development

   # For Google Auth (optional)
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=

   # For Nodemailer SMTP (optional, falls back to logging OTPs in console)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=
   EMAIL_PASS=

   # For Cloudinary Uploads (optional, falls back to local file hosting under /uploads)
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```
3. Launch the API server:
   ```bash
   npm run dev
   ```

### 2. Frontend Configuration
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   ```

---

## API Documentation

### Authentication (`/api/auth`)
- `POST /register`: Register name, email, password, role, department.
- `POST /login`: Verify credentials, drop Refresh Token Cookie, return Access Token.
- `POST /google-login`: Exchange Google GIS JWT tokens for access tokens.
- `POST /forgot-password`: Validate email, create OTP, trigger email dispatch.
- `POST /verify-otp`: Validate 6-digit OTP code match.
- `POST /reset-password`: Commit new password changes using valid OTP code.
- `POST /logout`: Wipe Refresh Token Cookie and audit logout action.
- `GET /me`: Returns authenticated session details (requires Bearer Access Token).

### Tasks (`/api/tasks`)
- `POST /`: Create task (Admin/Manager only).
- `GET /`: List tasks (paginated, supports status, priority, assignee search, and name queries).
- `GET /:id`: Retrieve task detail matching ID.
- `PUT /:id`: Modify task details (Employees are restricted to updating task `status` only).
- `DELETE /:id`: Delete task from database (Admin/Manager only).
- `POST /:id/comments`: Add comment on task.
- `POST /:id/attachments`: Upload file attachments (via Multer, accepts images, pdfs, sheets).
- `POST /bulk-status`: Update statuses for a list of task IDs in one operation.
- `POST /bulk-delete`: Delete multiple tasks simultaneously (Admin/Manager only).

### Users (`/api/users`)
- `GET /team`: Get list of active employee names and departments for selection selectors.
- `PUT /profile`: Update profile metadata (name, department).
- `PUT /avatar`: Change profile photo avatar.
- `PUT /change-password`: Update profile password.
- `GET /`: Get all users database records (Admin only).
- `PUT /:id/role`: Change user authorization role (Admin only).
- `PUT /:id/status`: Toggle user activation state (Admin only).

### Dashboard & Analytics (`/api/dashboard`)
- `GET /stats`: Retrieve KPI counts and data arrays for Recharts dashboards.

### Reports (`/api/reports`)
- `GET /weekly`: Gathers detailed metrics, user leaderboard scores, and task logs for export sheets (Admin/Manager only).

### Notifications (`/api/notifications`)
- `GET /`: Fetch user alerts history (unread/read logs).
- `PUT /read-all`: Mark all notifications as read.
- `PUT /:id/read`: Mark single notification as read.
- `DELETE /:id`: Delete alert record.
