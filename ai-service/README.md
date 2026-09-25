# ai-service: GameEducation AI Recommender

A small Python microservice (FastAPI) that the Spring Boot backend calls over HTTP to:

1. estimate a student's **mastery** per topic and per subject from their quiz history,
2. recommend **lessons** (revise / continue / start), each with a plain-language reason,
3. **segment** a class of students into support groups (needs support / on track / advanced).

Every output can be explained. There is no black-box model and no deep learning.

## Run

Windows (Git Bash), from this `ai-service/` directory:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m pytest -q                        # run tests
.venv/Scripts/python -m uvicorn main:app --port 8000     # start the server
```

(On Linux/macOS use `.venv/bin/python`.) Interactive docs: http://localhost:8000/docs

Requires Python 3.10+. Versions are pinned in `requirements.txt`.

## Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI app (`app`) and routes |
| `schemas.py` | Pydantic v2 request/response models (camelCase JSON) |
| `recommender.py` | Pure functions: mastery estimation and lesson ranking |
| `segmentation.py` | KMeans student segmentation, with a rules fallback |
| `tests/test_api.py` | pytest tests using `fastapi.testclient` |

## API contract

All JSON uses camelCase. Malformed input returns **422** (FastAPI's standard validation error).

### `GET /health`

```json
{"status":"ok","service":"ai-recommender","version":"1.0.0"}
```

### `POST /recommend`

Request (`answers` = this student's full answer history, `lessons` = the whole visible catalog **in curriculum order**; `limit` defaults to 4, range 1-50):

```json
{
  "studentId": 12,
  "answers": [
    {"topic":"linear-equations","subjectId":1,"subjectName":"Mathematics","correct":true,"answeredAt":"2026-09-20T10:15:00Z"}
  ],
  "lessons": [
    {"lessonId":3,"title":"Solving One-Step Equations","topic":"linear-equations","subjectId":1,"subjectName":"Mathematics",
     "chapterId":1,"chapterTitle":"Linear Equations","order":1,"completed":false}
  ],
  "limit": 4
}
```

Response:

```json
{
  "studentId": 12,
  "subjectMastery": [{"subjectId":1,"subjectName":"Mathematics","mastery":0.45,"answered":10}],
  "weakTopics": [{"topic":"linear-equations","subjectId":1,"subjectName":"Mathematics","mastery":0.38,"answered":5,"correct":2}],
  "recommendations": [
    {"lessonId":3,"title":"Solving One-Step Equations","subjectId":1,"subjectName":"Mathematics","chapterId":1,
     "chapterTitle":"Linear Equations","topic":"linear-equations","kind":"REVISE","priority":0.77,
     "reason":"Your estimated mastery of Linear Equations is 38% (2/5 quiz answers correct, recent answers weighted more). Revisiting this lesson should help."}
  ],
  "model": "bayesian-mastery-v1",
  "generatedAt": "2026-09-25T08:00:00.000000Z"
}
```

* `subjectMastery` lists only subjects with answers, sorted by mastery, lowest first.
* `weakTopics`: mastery < 0.6 **and** at least 2 answers. Sorted lowest first, at most 5.
* `recommendations`: sorted by `priority` (0..1) with the highest first. A lesson never appears twice. `kind` is one of:
  * `REVISE`: the first lesson in curriculum order for a weak topic. It is recommended even if already completed.
  * `CONTINUE`: the next uncompleted lesson in a subject the student has started (has answers or completed lessons there).
  * `START`: the first lesson of a subject the student hasn't touched.

### `POST /segments`

Request (`avgScore` is 0..100; `name` is optional):

```json
{"students":[{"studentId":1,"name":"Aarav","avgScore":72.5,"lessonsCompleted":6,"quizAttempts":4,"activeDays":5}]}
```

Response:

```json
{
  "segments": [{"studentId":1,"segment":"ON_TRACK","cluster":0,"reason":"..."}],
  "model": "kmeans-k3",
  "clusterSummaries": [{"segment":"NEEDS_SUPPORT","count":2,"avgScore":41.0,"avgLessons":1.5}]
}
```

* `segment` is one of `NEEDS_SUPPORT`, `ON_TRACK` or `ADVANCED`. Segments are returned in input order.
* `model` is `kmeans-k3`, or `kmeans-k2` when only 2 distinct feature rows exist. It is `rules` when the rules fallback was used.
* `cluster` is the KMeans cluster index, or **-1** when the student was placed by a rule (rules model, or zero quiz attempts).
* `clusterSummaries` has one entry per final segment present, ordered NEEDS_SUPPORT, ON_TRACK, ADVANCED.

## How it works

### Mastery ("bayesian-mastery-v1")

Mastery is a **recency-weighted, Bayesian-smoothed accuracy**. It is not a neural network or a trained model. For every answer:

```
weight   = 0.5 ** (age_in_days / 14)            # an answer 14 days old counts half
mastery  = (sum(weight * correct) + 1) / (sum(weight) + 2)
```

The `+1` and `+2` come from a Beta(1,1) prior. A topic with no answers therefore sits at **0.5**, and a few answers move it only part of the way. For example, 1 wrong answer gives 0.33, not 0%. Subject mastery uses the same formula over all answers in that subject. Timestamps in the future are treated as age 0, and timestamps without a timezone are treated as UTC.

### Recommendation ranking

| kind | priority |
|---|---|
| REVISE | `(1 - mastery) * confidence + 0.15`, where `confidence = min(1, answered / 5)` (capped at 1) |
| CONTINUE | `0.35 + 0.20 * (1 - completed/total lessons in subject)` (range 0.35 to 0.55) |
| START | `0.30`, reduced by 0.01 for each later subject so the curriculum order is kept |

A weak topic with plenty of evidence therefore ranks above continuing or starting. A weak topic backed by only 2 answers may rank below them. This is deliberate, because we are less sure it is really weak. Each reason quotes the real numbers behind it: estimated mastery, correct/answered counts, and lessons completed out of the total.

### Segmentation

1. Students with `quizAttempts == 0` go to **NEEDS_SUPPORT** with the reason "No quiz attempts yet" and are left out of clustering.
2. KMeans is used if at least 3 of the remaining students exist and they form at least 2 distinct feature rows:
   * the features `[avgScore, lessonsCompleted, quizAttempts, activeDays]` are standardised with `StandardScaler`
   * the model is `KMeans(n_clusters=min(3, distinct rows), n_init=10, random_state=42)`
   * clusters are named by ranking their centroid avgScore:
     * with 3 clusters: lowest is NEEDS_SUPPORT, middle is ON_TRACK, highest is ADVANCED
     * with 2 clusters: lowest is NEEDS_SUPPORT; highest is ADVANCED only if its centroid avgScore is at least 80, otherwise ON_TRACK
3. **Safety rule:** any student with `avgScore < 50` (and at least one attempt) is NEEDS_SUPPORT, whatever their cluster.
4. If there is too little data for KMeans (fewer than 3 students, or all identical), simple rules apply: below 50 is NEEDS_SUPPORT, 80 or above is ADVANCED, anything else is ON_TRACK. `model` is `"rules"`. An empty list returns an empty response with `model: "rules"`.

## Limitations (please read)

* **This is simple statistics, not deep learning.** Mastery is a smoothed, time-weighted accuracy. It knows nothing about question difficulty, guessing, or how topics relate to each other. (Methods such as IRT or BKT would model these; we don't.)
* **Small data gives indicative results only.** With a handful of answers per topic, or a small class, the numbers are rough signals to help a teacher. They are not assessments. The Beta prior keeps estimates close to 50% until real evidence builds up.
* **Clusters are relative to the cohort sent in.** KMeans groups students by similarity within the request. In a class where everyone is strong, the "lowest" cluster is still labelled NEEDS_SUPPORT, even if its members score well. With 3 clusters, the ADVANCED label also has no absolute score threshold. Always read the `reason` and `clusterSummaries`, not just the label. Segment labels should support teacher judgement, not replace it.
* **Rules fallback** is used for fewer than 3 students, or when all students have identical features. KMeans needs something to separate.
* The tuning constants (14-day half-life, 0.6 weak threshold, priority weights) are sensible defaults. They were **not** fitted to real learning outcomes.
* The service keeps no state: it stores nothing and learns nothing between calls.
