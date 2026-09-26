# ShikshaSetu — Gamified Learning Platform for Rural Education

An offline-first, gamified STEM learning platform for students in Grades 6–12, with teacher analytics, an admin console and an explainable recommendation service.

```
React PWA (Vite)  ──/api──▶  Spring Boot API  ──HTTP──▶  FastAPI + scikit-learn
   IndexedDB + SW             JWT · RBAC · JPA              mastery · KMeans
                                    │
                            H2 (dev) / PostgreSQL
```

| Part | Stack | Folder |
|---|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7, Chart.js, IndexedDB (`idb`), service worker | `/` (`src/`, `public/`) |
| Backend | Java 21 (runs on JDK 21+), Spring Boot 3.5, Spring Security, JWT (jjwt), BCrypt, Spring Data JPA | `backend/` |
| Database | H2 in PostgreSQL mode (default, zero-install) or PostgreSQL (`postgres` profile); schema managed by Flyway | `backend/src/main/resources/db/migration` |
| AI service | Python 3.10+, FastAPI, pandas, NumPy, scikit-learn | `ai-service/` |

---

## Quick start (three terminals)

Prerequisites: **JDK 21+**, **Node 20+**, **Python 3.10+**. Maven is not required (the wrapper downloads it).

**1. AI service** (optional — the backend falls back to built-in rules if it is not running)

```bash
cd ai-service
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt     # Linux/macOS: .venv/bin/python
.venv/Scripts/python -m uvicorn main:app --port 8000
```

**2. Backend** — http://localhost:8080

```bash
cd backend
./mvnw spring-boot:run            # Windows cmd/PowerShell: mvnw.cmd spring-boot:run
```

On first start it creates `backend/data/` (H2 database) and seeds the curriculum, demo accounts and two weeks of realistic class activity (~10 s). Optional: create `backend/.env` with `JWT_SECRET=<32+ random chars>` so sessions survive restarts.

**3. Frontend** — http://localhost:5173

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` to the backend.

### Demo accounts (development seed only)

| Role | Email | Password |
|---|---|---|
| Student | `aarav@shiksha.org` | `Student@123` |
| Teacher | `teacher@shiksha.org` | `Teacher@123` |
| Admin | `admin@shiksha.org` | `Admin@123` |

Seven more students (`priya@`, `rohan@`, `kavya@`, `manish@`, `ananya@`, `imran@`, `deepa@shiksha.org`) share the password `Student@123`. They are all in the teacher's class **Class 8 – Section A** at *Govt. High School, Sundargarh*. The class code is random: the teacher dashboard and the admin **Classes** page show it, and a new student enters it during onboarding (or later in the profile) to join the class.

All roles use the same sign-in form, which has a **Student / Teacher / Admin** selector.
- The chosen role is sent with the credentials. If it doesn't match the account's real role, the server rejects the sign-in with `ROLE_MISMATCH` and issues no token. The check runs only after the password is verified, so it reveals nothing to someone without the credentials.
- After sign-in, each role goes to its own dashboard (`/admin`, `/teacher` or `/student`). Pages for other roles redirect back to the user's home, and the API returns 403.

Registration offers **Student / Teacher** only:
- Students go through onboarding as before.
- Teachers go straight to their dashboard, which stays empty until an admin assigns them a class.

There is exactly **one admin account** (`admin@shiksha.org`, seeded):
- Public registration rejects `role=ADMIN` with 400 `ROLE_NOT_ALLOWED`; the requested role is validated on the server, never trusted.
- The admin **Users** page can only create students and teachers, and the API rejects `ADMIN` there too.
- No endpoint changes an existing user's role.

The sign-in dialog has a **Demo accounts** list (role + email; click to sign in, passwords are never displayed). It appears:
- in `npm run dev`;
- in production builds made with `VITE_DEMO_ACCOUNTS=true`, which is what the Docker `web` image does by default (`DEMO_ACCOUNTS` in compose).

For any real deployment, set `DEMO_ACCOUNTS=false` and `SEED_ENABLED=false`. Without the flag, the demo list is compiled out of the bundle. To reset the demo data, stop the backend and delete `backend/data/`.

### Trying the offline mode

The service worker is registered only in production builds:

```bash
npm run build
npm run preview        # http://localhost:4173 (also proxies /api)
```

Sign in as the student, open a chapter and press **Download for offline**. Then switch the browser offline (DevTools → Network → Offline) and reload. The app still opens, the lessons can be read and completed, and the quiz can be taken. When you go back online, the queued actions sync automatically and the quiz result appears.

### Using PostgreSQL (the deployment profile)

H2 stays the zero-install default for local development (`dev` profile). The `postgres` profile is for real deployments. It needs:

| Variable | Default | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` | set to `postgres` |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/shikshasetu` | PostgreSQL 14+ |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | `shikshasetu` / *(empty)* | use a normal (non-superuser) role that owns the database |
| `JWT_SECRET` | *(none)* | **required**: the profile refuses to start without it (32+ random characters) |
| `DATABASE_POOL_SIZE` | `10` | Hikari connection pool size |
| `SEED_ENABLED` | `true` | set `false` unless you want the demo curriculum, accounts and history |

```bash
# any PostgreSQL 14+ (e.g. `docker compose up -d postgres`, or a local install):
#   create role shikshasetu login password '...';  create database shikshasetu owner shikshasetu;
cd backend
SPRING_PROFILES_ACTIVE=postgres DATABASE_PASSWORD=... JWT_SECRET=... ./mvnw spring-boot:run
# or the packaged jar:  ./mvnw -DskipTests package && java -jar target/shikshasetu-backend-1.0.0.jar
```

On first start, Flyway applies `V1`–`V6` in `backend/src/main/resources/db/migration`. `V5` is a Java data migration in `backend/src/main/java/db/migration`. Hibernate then validates the entities against the schema, and the seeders load the demo data and the Hindi/Odia/Telugu content. The same migrations run on H2. Existing H2 databases are upgraded in place: students keep their teacher through a class, and whole-class assignments move to that class.

This was checked against a real PostgreSQL 14.15 server, not only unit tests. The binaries came from the `embedded-postgres` test dependency and ran with password auth and a dedicated owner role. The packaged jar migrated and seeded an empty database, and the Postman collection (70/70 assertions) and both browser suites (50/50 checks) passed against it.

### Docker (whole stack)

```bash
JWT_SECRET=<32+ random characters> docker compose --profile full up --build
# PWA on http://localhost:8081 (nginx, proxies /api) · API on :8080 · PostgreSQL on :5432
```

The Dockerfiles are `backend/Dockerfile`, `ai-service/Dockerfile` and `Dockerfile` (frontend plus `docker/nginx.conf`).

**Docker was not available in the development environment, so no image has been built and the stack has never run under Docker.**

What was checked without Docker:
- **Dockerfiles:** all three pass `hadolint` 2.12 with no findings.
- **Compose file:** `docker-compose.yml` validates against the official Compose Specification JSON schema.
- **nginx config:** it was run for real with nginx 1.26. The only changes were the upstream host (`backend` became `127.0.0.1`) and the listen port. Through it, the full browser suite passed (30/30, including the service worker, offline reload and sync). It also served the SPA fallback, the cache headers and the API proxy correctly.
- **Image contents:** each image runs the same commands that work locally: the backend jar (`java -jar`, migrations and seed from inside the jar), the frontend production build, and the AI service under uvicorn.

That review found and fixed two bugs that would have broken the Docker stack:
- **Sign-in rejected:** nginx forwarded `Host` without the port. Spring then treated the browser's same-origin POSTs as cross-origin and rejected them with 403. It now forwards `$http_host`, and compose also sets `CORS_ALLOWED_ORIGINS`.
- **Manifest type:** nginx served `manifest.webmanifest` as `application/octet-stream`. It is now `application/manifest+json`.

Still unverified until someone runs `docker compose --profile full up --build`:
- the image builds themselves (base images, `npm ci`, `pip install` on `python:3.12-slim`, the Maven build);
- compose networking and DNS between containers, and start-up ordering (the backend waits for the PostgreSQL healthcheck);
- file permissions for the non-root users;
- the named volume.

### Postman

Import `docs/postman/ShikshaSetu.postman_collection.json`, or run it from the command line against a running backend:

```bash
npx newman run docs/postman/ShikshaSetu.postman_collection.json
```

The collection has 49 requests and 90 assertions. It covers:
- auth and RBAC denials;
- the full student loop, including localized content, quiz answer locking, removal of the old answer-probing endpoint and an idempotent replay;
- joining a class with its code;
- the teacher analytics, the PDF student report and topic CSV, the single-admin rules, and the admin endpoints.

Each run registers a new student, so the demo accounts are left unchanged. It passed against both H2 (`npx newman run … `) and PostgreSQL (`--env-var baseUrl=http://localhost:8085/api`).

---

## UI

The approved Indigo/Violet frontend (landing page, sign-in dialog, student dashboard, course catalog, lesson view, quiz, results, achievements, leaderboard, profile, teacher dashboard, sidebar and top bar) is kept as designed. Each screen's hardcoded mock data was replaced with live API data, and the functionality it only pretended to have was made real. Screens that did not exist before (subject/chapter pages, missions, For You, progress, offline downloads, onboarding, admin) use the same components and styling.

Functional changes to existing screens:
- The top-bar offline toggle is now a real connectivity and sync indicator.
- The bell now lists real assignments and pending syncs.
- "Regional Voice" reads the lesson aloud through the browser's speech synthesis.
- The fictional coin rewards store tab became an XP-history tab.
- Leaderboard tabs are now weekly, all-time and classmates.
- Sign-in and sign-up have a role selector (sign-up: Student or Teacher only).

## Features

**Student**
- Onboarding (grade, language, school, optional class code) after registration.
- Dashboard: level and XP, streak, lessons completed, average quiz score, badges, next lesson, progress by subject, daily missions, teacher assignments, recommendations and recent activity.
- Subjects → chapters → lessons (Markdown content). Mark a lesson complete → quiz.
- Chapter quizzes: the original one-question-at-a-time flow with a timer, **Submit Answer** and instant *Correct/Incorrect + explanation*. See **Quiz security** below. The whole attempt is graded on the server and scored for XP. Offline, answers are saved without feedback and scored after sync.
- Gamification:
  - XP: 20 per lesson; 10 per correct answer + 20 for completing a quiz (first attempt); later attempts only earn XP for improving your best score; +25 perfect-score bonus.
  - Levels: `threshold(L) = 25·(L−1)·(L+2)`, i.e. 0 / 100 / 250 / 450 …
  - Streaks, 9 badges and 4 daily missions.
  - A leaderboard.
- **For You**: recommendations with the evidence behind them (mastery per subject, weak topics).
- Offline library, sync status, English / हिन्दी / ଓଡ଼ିଆ / తెలుగు interface **and lesson content**, and dark mode.

**Teacher**: their classes (with each class's join code and a class filter), class overview (KPIs, average score by subject, score distribution, 14-day activity, completion by subject), students needing support (KMeans segments), a student list with filters, per-student detail with topic accuracy, a weak-topics page, and assignments (a lesson or quiz, to the whole class or one student, with completion tracking). **Student reports are PDFs**: pick a student on the Class Reports tab, or open a student, and press **Download PDF**. Admins can download any student's report from **Users**. The report contains student details, class and teacher, progress, subject performance, recent quizzes, topic accuracy and badges. It only uses tracked data: there is no attendance register, so it shows active days. Topic accuracy is still exported as CSV (UTF-8, one header row) for Excel and Power BI.

**Admin**: platform statistics (users, content, engagement, AI-service health), schools and classes (create, assign a teacher, regenerate join codes), user management (create, edit, deactivate, delete, place a student in a class), and content management (subjects, chapters, lessons, quizzes, questions). Content that students have already completed or answered cannot be deleted.

## Languages

The interface and the learning content are available in English, हिन्दी (Hindi), ଓଡ଼ିଆ (Odia) and తెలుగు (Telugu).

- **Interface text:** `src/i18n/{en,hi,or,te}.js`, all with the same 821 keys. `node scripts/check-i18n.mjs` checks keys, `{placeholders}` and script.
- **Content:** subjects, chapters, all 30 lessons, 15 quizzes and 90 questions with their options and explanations are translated. The translation tables were added in `V3`, and the seed files are in `backend/src/main/resources/seed/i18n/<lang>/<subject>.json`.
  - The app sends its language as `Accept-Language`, and the API serves translated text with English as the fallback. A lesson without a translation shows a small "shown in English" note.
  - Answer order, answer keys, topics and scoring are shared, so grading never depends on the language.
- **Server-generated text:** recommendation reasons, the activity feed, badge and mission names, and weekday names are phrased in the app language. For recommendations, the API returns the facts behind each one (`reasonParams`). In English, the AI service's own explanation is shown word for word.
- **Not translated:** things people type (names, schools, assignment titles written by a teacher) stay as entered. XP-history entries are stored in English.
- **How the translations were made:** they were drafted with AI assistance, following NCERT and state-board terminology, with the English term in brackets on first use. Code, formulas and numbers are kept exactly as written. `python scripts/validate_translations.py` checks every file against the English source: structure, verbatim code and formulas, numbers in questions, script, and that no single option carries a note that would give the answer away. **They have not yet been reviewed by native-speaker teachers. That review is recommended before classroom use.**
- **Updating content:** edit the seed files and run the validator. The `TranslationSeeder` only adds missing translations, and only where the stored English still matches the seed. If an admin later edits a lesson's English text, its existing translations are not updated automatically.

## Schools and classes

- **Structure:** admins manage **schools** and **classes** on the **Classes** page. A class belongs to a school and has one teacher.
- **Students:** a student belongs to one class, and the class's teacher is the student's teacher.
- **Joining a class:** students join with the class's 6-character code during onboarding or later in their profile. An admin can also place a student in a class, or move them, from **Users**. Codes can be regenerated, which invalidates the old one.
- **Teacher scope:** teachers only see and assign work within the classes they teach. The analytics, weak topics, assignments and the topic CSV take an optional `classId`, and PDF reports are limited to the teacher's own students (404 otherwise), and a teacher with several classes gets a class picker. The backend enforces this: another teacher's student or class returns 404.
- **Migrating existing data:** `V4`–`V6` moved the old direct student→teacher links into one class per teacher. Each class sits at the school most of that teacher's students named. Whole-class assignments moved to the class. The migration is tested on H2 and PostgreSQL with pre-migration data (`ClassMigrationTest`).

## Quiz security

- **Questions:** quiz questions are sent without answers, and the score is always computed on the server.
- **Answer locking:** instant feedback now needs an open quiz session (`POST /api/quizzes/{id}/session`). **Submit Answer** calls `POST …/session/answers`, which stores that answer first and only then returns correct/incorrect, the correct option and the explanation.
- **No changing answers:** a stored answer can't be changed. Asking again returns the original answer, and submitting (online or via offline sync) grades the stored answers even if the request claims otherwise. The old stateless `/check` endpoint, which let a student probe the answer key, is gone.
- **Resuming:** reloading the page resumes the same session at the first unanswered question.
- **Remaining trade-offs:**
  - The answer to a question is revealed once the student has committed to one. Everything is revealed on the result screen after submitting, and retakes only earn XP for improvement.
  - The quiz timer runs in the browser and is not enforced by the server.

## Charts

The original requirements list Chart.js as the chart library ("Include charts using Chart.js or the chart library already present"). Plotly is only named in the general stack list. All charts therefore stay on the existing Chart.js wrapper, unchanged. Data for external analysis comes from the Power BI/Excel-ready topic CSV rather than a second charting library.

## How the "AI" works (honest version)

- **Mastery / weak topics** (`ai-service/recommender.py`): for each topic, a recency-weighted accuracy (half-life 14 days) smoothed with a Beta(1,1) prior, so an untested topic counts as 50%. Topics below 60% with at least 2 answers are weak. Recommendations are ranked by `(1 − mastery) × confidence`, and every reason quotes the real numbers.
- **Student segmentation** (`ai-service/segmentation.py`): scikit-learn `KMeans` (k = 3) on standardised [average score, lessons, attempts, active days]. Clusters are labelled by their centroid score. A safety rule always flags students under 50% or with no attempts, and fewer than 3 students falls back to plain rules.
- This is a transparent statistical model, not deep learning. With a class of about 8 students the segments are indicative only. If the Python service is down, the backend uses a simpler Java rule set and the UI says so (`source: fallback`).

## Architecture notes

- **Auth**: `POST /api/auth/login` returns a JWT (HS256). Passwords are hashed with BCrypt. Roles (`STUDENT`, `TEACHER`, `ADMIN`) are enforced in `SecurityConfig` on every endpoint group, and the React route guards are only for UX. Login checks the selected role against the account; public registration creates students or teachers only, and there is a single admin.
- **Idempotency**: lesson completion is unique per student and lesson. Quiz submissions carry a client UUID (`clientAttemptId`, unique per student). Every XP grant has a unique `refKey`. Replaying offline actions therefore never double-counts.
- **Offline** (`src/lib/offlineStore.js`, `src/lib/sync.js`, `public/sw.js`):
  - The service worker caches the app shell and hashed assets.
  - IndexedDB stores downloaded chapters (lessons + quiz without answers), "last seen" snapshots of read-only screens, and an outbox of offline actions.
  - The outbox is flushed in order when the browser comes back online.
  - Offline quizzes are scored after sync, because answers are never sent to the client.
- **Database**: Flyway owns the schema. `V1` is the baseline, `V2` adds quiz sessions, `V3` content translations, `V4`–`V6` schools and classes (with a Java data migration). Hibernate runs with `ddl-auto=validate`, so a mismatch between the entities and the schema stops startup. Any schema change needs a new migration. Databases created by builds before Flyway are adopted as version 1 (`baseline-on-migrate`). Tables: `users`, `student_profiles` (with the teacher relation), `subjects`, `chapters`, `lessons`, `quizzes`, `questions`, `question_options`, `quiz_attempts`, `attempt_answers`, `lesson_progress`, `xp_transactions`, `badges`, `student_badges`, `recommendations`, `assignments`.

### Main endpoints

```
POST /api/auth/login · POST /api/auth/register · GET /api/auth/me · PUT /api/users/me
GET  /api/subjects · /api/subjects/{id} · /api/chapters/{id} · /api/chapters/{id}/offline-bundle
GET  /api/lessons/{id} · POST /api/lessons/{id}/complete · GET /api/catalog/outline
GET  /api/quizzes/{id} · POST /api/quizzes/{id}/session · POST /api/quizzes/{id}/session/answers · POST /api/quizzes/{id}/submit
GET  /api/students/me/{dashboard|progress|badges|xp|missions|recommendations|assignments|leaderboard|attempts}
PUT  /api/students/me/onboarding · PUT /api/students/me/class
GET  /api/teacher/{overview|students|students/{id}|weak-topics|assignments} · POST/DELETE /api/teacher/assignments
GET  /api/teacher/classes · /api/teacher/reports/topics.csv      (teacher views accept ?classId=)
GET  /api/teacher/students/{id}/report.pdf · /api/admin/students/{id}/report.pdf      (application/pdf)
GET/POST/PUT/DELETE /api/admin/schools · /api/admin/classes · POST /api/admin/classes/{id}/join-code
GET  /api/admin/{stats|users|content|lessons/{id}|quizzes/{id}} · POST/PUT/DELETE users, subjects, chapters, lessons, quizzes, questions
```

## Tests

```bash
cd backend && ./mvnw test                                  # 23 tests (8 classes), see below
cd ai-service && .venv/Scripts/python -m pytest -q         # 18 tests: mastery, recommendations, segmentation, validation
npm run lint && npm run build                              # frontend
node scripts/check-i18n.mjs                                # UI dictionaries: same keys, placeholders, script
python scripts/validate_translations.py                    # lesson/quiz translations against the English source
npx newman run docs/postman/ShikshaSetu.postman_collection.json   # 49 requests / 90 assertions (backend running)
```

Backend test classes:
- `ApiIntegrationTest`: auth, RBAC, the learning loop, idempotent sync, analytics, topic CSV.
- `AuthRoleAndReportTest`: the 3 × 3 sign-in role matrix, public registration (student, teacher, forged ADMIN), the single admin, and the PDF report (parsed text, content type, file name, teacher/admin/student scoping).
- `QuizSecurityTest`: no answers in quiz payloads, answer locking, graded locked answers, RBAC.
- `ContentLocalizationTest`: hi/or/te content, fallback, language-independent grading, localized recommendations and activity.
- `ClassModelTest`: admin → school → class → teacher → student relationships, and teacher scoping and RBAC.
- `ClassMigrationTest`: V4–V6 on pre-migration data, on H2 **and** PostgreSQL.
- `PostgresMigrationTest`: all migrations and the learning loop on the `postgres` profile.
- `LevelsTest`.

The PostgreSQL tests start real PostgreSQL binaries through the `io.zonky.test:embedded-postgres` test dependency, so no Docker or local install is needed. The first run downloads them from Maven Central.

End-to-end browser checks were run with Playwright on the production build. They include the offline reload and sync, the teacher and admin flows, role selection and mismatches, PDF and CSV downloads, classes, quiz resume, and the student flow in Hindi, Odia and Telugu. They ran through `vite preview` on H2, through the real nginx config, and against the PostgreSQL-backed jar.

## Known limitations

- **Docker:** the images have never been built or run (see *Docker* above for what was verified instead).
- **Translations:** they were drafted with AI assistance and pass the automated checks, but still need review by native-speaker teachers. Content edited by an admin in English does not update its translations. Teacher-typed text and the XP history stay in the language they were written in.
- **PDF reports** are generated in English with the built-in Helvetica font (OpenPDF cannot shape Devanagari, Odia or Telugu text). Names typed in those scripts would not render in the PDF; the app screens are unaffected.
- **Quiz timer:** it is enforced only in the browser (it restarts if the page is reloaded; locked answers are kept).
- **Recommendations:** with a class of about 8 students, the KMeans segments are indicative only.
- **Bundle size:** the student bundle is about 845 kB (239 kB gzipped), mostly React, Chart.js and the four UI dictionaries. Teacher and admin screens are code-split. Loading dictionaries per language would be the next optimisation.
