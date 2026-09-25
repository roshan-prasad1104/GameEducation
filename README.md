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

Seven more students (`priya@`, `rohan@`, `kavya@`, `manish@`, `ananya@`, `imran@`, `deepa@shiksha.org`) share the password `Student@123`. The sign-in dialog shows one-click demo buttons in `npm run dev` only. Set `SEED_ENABLED=false` for any real deployment. To reset the demo data, stop the backend and delete `backend/data/`.

### Trying the offline mode

The service worker is registered only in production builds:

```bash
npm run build
npm run preview        # http://localhost:4173 (also proxies /api)
```

Sign in as the student, open a chapter and press **Download for offline**. Then switch the browser offline (DevTools → Network → Offline) and reload. The app still opens, the lessons can be read and completed, and the quiz can be taken. When you go back online, the queued actions sync automatically and the quiz result appears.

### Using PostgreSQL

```bash
docker compose up -d postgres            # or use any PostgreSQL 14+ instance
cd backend
SPRING_PROFILES_ACTIVE=postgres DATABASE_PASSWORD=shikshasetu ./mvnw spring-boot:run
```

Flyway creates the schema on first start (`V1__baseline_schema.sql`). See `.env.example` for all variables.

### Docker (whole stack)

```bash
JWT_SECRET=<32+ random characters> docker compose --profile full up --build
# PWA on http://localhost:8081 (nginx, proxies /api) · API on :8080 · PostgreSQL on :5432
```

Dockerfiles: `backend/Dockerfile`, `ai-service/Dockerfile`, `Dockerfile` (frontend + `docker/nginx.conf`). See the limitations below: these were not run in the development environment.

### Postman

Import `docs/postman/ShikshaSetu.postman_collection.json`, or run it from the command line against a running backend:

```bash
npx newman run docs/postman/ShikshaSetu.postman_collection.json
```

The collection has 28 requests and 47 assertions. It covers auth, the full student loop including an idempotent replay, RBAC denials, the teacher analytics and CSV export, and the admin endpoints. Each run registers a new student, so the demo accounts are left unchanged.

---

## UI

The approved Indigo/Violet frontend (landing page, sign-in dialog, student dashboard, course catalog, lesson view, quiz, results, achievements, leaderboard, profile, teacher dashboard, sidebar and top bar) is kept as designed. Each screen's hardcoded mock data was replaced with live API data, and the functionality it only pretended to have was made real. Screens that did not exist before (subject/chapter pages, missions, For You, progress, offline downloads, onboarding, admin) use the same components and styling.

Functional changes to existing screens:
- The top-bar offline toggle is now a real connectivity and sync indicator.
- The bell now lists real assignments and pending syncs.
- "Regional Voice" reads the lesson aloud through the browser's speech synthesis.
- The fictional coin rewards store tab became an XP-history tab.
- Leaderboard tabs are now weekly, all-time and classmates.
- Public sign-up is student-only.

## Features

**Student**
- Onboarding (grade, language, school) after registration.
- Dashboard: level and XP, streak, lessons completed, average quiz score, badges, next lesson, progress by subject, daily missions, teacher assignments, recommendations and recent activity.
- Subjects → chapters → lessons (Markdown content). Mark a lesson complete → quiz.
- Chapter quizzes: the original one-question-at-a-time flow with a timer. **Submit Answer** checks each answer on the server (`POST /api/quizzes/{id}/check`) for instant feedback and an explanation. The whole attempt is then graded on the server and scored for XP. Offline, answers are saved without feedback and scored after sync.
- Gamification:
  - XP: 20 per lesson; 10 per correct answer + 20 for completing a quiz (first attempt); later attempts only earn XP for improving your best score; +25 perfect-score bonus.
  - Levels: `threshold(L) = 25·(L−1)·(L+2)`, i.e. 0 / 100 / 250 / 450 …
  - Streaks, 9 badges and 4 daily missions.
  - A leaderboard.
- **For You**: recommendations with the evidence behind them (mastery per subject, weak topics).
- Offline library, sync status, English / हिन्दी UI, and dark mode.

**Teacher**: class overview (KPIs, average score by subject, score distribution, 14-day activity, completion by subject), students needing support (KMeans segments), a student list with filters, per-student detail with topic accuracy, a weak-topics page, and assignments (a lesson or quiz, to the whole class or one student, with completion tracking). The Class Reports tab exports the roster and the topic accuracy as CSV (UTF-8, one header row) that opens directly in Excel and loads into Power BI.

**Admin**: platform statistics (users, content, engagement, AI-service health), user management (create, edit, deactivate, delete, assign a teacher), and content management (subjects, chapters, lessons, quizzes, questions). Content that students have already completed or answered cannot be deleted.

## How the "AI" works (honest version)

- **Mastery / weak topics** (`ai-service/recommender.py`): for each topic, a recency-weighted accuracy (half-life 14 days) smoothed with a Beta(1,1) prior, so an untested topic counts as 50%. Topics below 60% with at least 2 answers are weak. Recommendations are ranked by `(1 − mastery) × confidence`, and every reason quotes the real numbers.
- **Student segmentation** (`ai-service/segmentation.py`): scikit-learn `KMeans` (k = 3) on standardised [average score, lessons, attempts, active days]. Clusters are labelled by their centroid score. A safety rule always flags students under 50% or with no attempts, and fewer than 3 students falls back to plain rules.
- This is a transparent statistical model, not deep learning. With a class of about 8 students the segments are indicative only. If the Python service is down, the backend uses a simpler Java rule set and the UI says so (`source: fallback`).

## Architecture notes

- **Auth**: `POST /api/auth/login` returns a JWT (HS256). Passwords are hashed with BCrypt. Roles (`STUDENT`, `TEACHER`, `ADMIN`) are enforced in `SecurityConfig` on every endpoint group, and the React route guards are only for UX. Public registration always creates a student.
- **Idempotency**: lesson completion is unique per student and lesson. Quiz submissions carry a client UUID (`clientAttemptId`, unique per student). Every XP grant has a unique `refKey`. Replaying offline actions therefore never double-counts.
- **Offline** (`src/lib/offlineStore.js`, `src/lib/sync.js`, `public/sw.js`):
  - The service worker caches the app shell and hashed assets.
  - IndexedDB stores downloaded chapters (lessons + quiz without answers), "last seen" snapshots of read-only screens, and an outbox of offline actions.
  - The outbox is flushed in order when the browser comes back online.
  - Offline quizzes are scored after sync, because answers are never sent to the client.
- **Database**: Flyway owns the schema (`db/migration/V1__baseline_schema.sql`, named constraints and foreign-key indexes). Hibernate runs with `ddl-auto=validate`, so a mismatch between the entities and the schema stops startup. Any schema change needs a new `V<n>__*.sql` file. Databases created by earlier builds are adopted as version 1 (`baseline-on-migrate`). Tables: `users`, `student_profiles` (with the teacher relation), `subjects`, `chapters`, `lessons`, `quizzes`, `questions`, `question_options`, `quiz_attempts`, `attempt_answers`, `lesson_progress`, `xp_transactions`, `badges`, `student_badges`, `recommendations`, `assignments`.

### Main endpoints

```
POST /api/auth/login · POST /api/auth/register · GET /api/auth/me · PUT /api/users/me
GET  /api/subjects · /api/subjects/{id} · /api/chapters/{id} · /api/chapters/{id}/offline-bundle
GET  /api/lessons/{id} · POST /api/lessons/{id}/complete · GET /api/catalog/outline
GET  /api/quizzes/{id} · POST /api/quizzes/{id}/check · POST /api/quizzes/{id}/submit
GET  /api/students/me/{dashboard|progress|badges|xp|missions|recommendations|assignments|leaderboard|attempts}
PUT  /api/students/me/onboarding
GET  /api/teacher/{overview|students|students/{id}|weak-topics|assignments} · POST/DELETE /api/teacher/assignments
GET  /api/teacher/reports/{students|topics}.csv
GET  /api/admin/{stats|users|content|lessons/{id}|quizzes/{id}} · POST/PUT/DELETE users, subjects, chapters, lessons, quizzes, questions
```

## Tests

```bash
cd backend && ./mvnw test                                  # 7 tests: auth, RBAC, learning loop, idempotent sync, analytics, CSV,
                                                           #   and PostgresMigrationTest on a real embedded PostgreSQL
cd ai-service && .venv/Scripts/python -m pytest -q         # 18 tests: mastery, recommendations, segmentation, validation
npm run lint && npm run build                              # frontend
```

`PostgresMigrationTest` starts real PostgreSQL binaries through the `io.zonky.test:embedded-postgres` test dependency, so no Docker or local install is needed. Its first run downloads them from Maven Central. The test then applies the Flyway migrations, validates the entities, loads the seed and runs the learning loop on the `postgres` profile.

End-to-end browser checks (student journey including offline and sync, teacher and admin flows, CSV downloads) were run with Playwright against `npm run preview`. The API was also checked with the Postman collection via newman.

## Known limitations

- Lesson **content** is English only; the UI is translated into English and Hindi. Content translations would need a translation table.
- **Docker**: the development environment had no Docker, so the Dockerfiles and `docker-compose.yml` have not been built or run. Their individual steps were checked separately:
  - the frontend build, and `mvn -DskipTests package` followed by `java -jar` on a fresh database (migrations and seed load from the jar);
  - the `postgres` profile, via the embedded-PostgreSQL test above;
  - the compose file parses as valid YAML.
- **PostgreSQL**: the day-to-day demo database is H2 (PostgreSQL mode). PostgreSQL itself is exercised by the automated test, not by a long-running server.
- A new student is attached to the first teacher; there is no school/class model yet (admins can reassign students).
- The per-question check endpoint lets a determined student probe answers through the API before submitting. This is an accepted trade-off to keep the original instant-feedback quiz design, since the final score is still computed on the server.
- Odia and Telugu cover the original screens' labels only; English and Hindi are complete.
- The student bundle is about 570 kB (180 kB gzipped), mostly React and Chart.js. Teacher and admin screens are code-split.
