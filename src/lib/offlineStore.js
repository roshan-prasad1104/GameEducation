import { openDB } from 'idb';

/**
 * IndexedDB store for offline learning.
 *   bundles  — downloaded chapters (chapter + lessons + quiz), keyed by chapter id
 *   lessons  — lesson details, keyed by lesson id (filled from bundles and every online view)
 *   quizzes  — quiz questions (no answers), keyed by quiz id
 *   outbox   — actions performed offline, waiting to be synced
 *   results  — server results of synced offline quiz attempts, keyed by clientAttemptId
 *   snapshots — last successful response of read-only screens (dashboard, subjects…)
 *
 * Data is scoped per signed-in user via the `owner` field / key prefix.
 */
const DB_NAME = 'shikshasetu-offline';
const DB_VERSION = 1;

let dbPromise = null;

const db = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('bundles', { keyPath: 'key' });
        database.createObjectStore('lessons', { keyPath: 'key' });
        database.createObjectStore('quizzes', { keyPath: 'key' });
        const outbox = database.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        outbox.createIndex('owner', 'owner');
        database.createObjectStore('results', { keyPath: 'clientAttemptId' });
        database.createObjectStore('snapshots', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
};

/** Every call is wrapped so a blocked/unsupported IndexedDB never breaks the online app. */
const safe = async (fn, fallback = null) => {
  try {
    return await fn(await db());
  } catch {
    return fallback;
  }
};

const k = (owner, id) => `${owner}:${id}`;

export const offlineStore = {
  // ---- downloaded chapters
  async saveBundle(owner, bundle) {
    return safe(async (d) => {
      const tx = d.transaction(['bundles', 'lessons', 'quizzes'], 'readwrite');
      const chapter = bundle.chapter;
      await tx.objectStore('bundles').put({
        key: k(owner, chapter.id), owner, chapterId: chapter.id, chapter, savedAt: new Date().toISOString(),
        lessonIds: bundle.lessons.map((l) => l.id), quizId: bundle.quiz?.id ?? null,
      });
      for (const lesson of bundle.lessons) {
        await tx.objectStore('lessons').put({ key: k(owner, lesson.id), owner, data: lesson });
      }
      if (bundle.quiz) await tx.objectStore('quizzes').put({ key: k(owner, bundle.quiz.id), owner, data: bundle.quiz });
      await tx.done;
      return true;
    }, false);
  },
  async removeBundle(owner, chapterId) {
    return safe(async (d) => {
      const bundle = await d.get('bundles', k(owner, chapterId));
      if (!bundle) return;
      const tx = d.transaction(['bundles', 'lessons', 'quizzes'], 'readwrite');
      await tx.objectStore('bundles').delete(bundle.key);
      for (const id of bundle.lessonIds) await tx.objectStore('lessons').delete(k(owner, id));
      if (bundle.quizId) await tx.objectStore('quizzes').delete(k(owner, bundle.quizId));
      await tx.done;
    });
  },
  async listBundles(owner) {
    return safe(async (d) => (await d.getAll('bundles')).filter((b) => b.owner === owner), []);
  },
  async hasBundle(owner, chapterId) {
    return safe(async (d) => Boolean(await d.get('bundles', k(owner, chapterId))), false);
  },

  // ---- individual items
  async getLesson(owner, id) {
    return safe(async (d) => (await d.get('lessons', k(owner, id)))?.data ?? null);
  },
  async getQuiz(owner, id) {
    return safe(async (d) => (await d.get('quizzes', k(owner, id)))?.data ?? null);
  },
  /** Patch a cached lesson (e.g. mark it completed after an offline completion). */
  async patchLesson(owner, id, patch) {
    return safe(async (d) => {
      const row = await d.get('lessons', k(owner, id));
      if (row) await d.put('lessons', { ...row, data: { ...row.data, ...patch } });
    });
  },

  // ---- snapshots of read-only screens
  async saveSnapshot(owner, key, data) {
    return safe((d) => d.put('snapshots', { key: k(owner, key), data, savedAt: new Date().toISOString() }));
  },
  async getSnapshot(owner, key) {
    return safe(async (d) => (await d.get('snapshots', k(owner, key))) ?? null);
  },

  // ---- outbox
  async enqueue(owner, action) {
    return safe((d) => d.add('outbox', { ...action, owner, createdAt: new Date().toISOString(), attempts: 0 }));
  },
  async pending(owner) {
    return safe((d) => d.getAllFromIndex('outbox', 'owner', owner), []);
  },
  async updateAction(action) {
    return safe((d) => d.put('outbox', action));
  },
  async removeAction(id) {
    return safe((d) => d.delete('outbox', id));
  },

  // ---- synced results
  async saveResult(clientAttemptId, result) {
    return safe((d) => d.put('results', { clientAttemptId, result }));
  },
  async getResult(clientAttemptId) {
    return safe(async (d) => (await d.get('results', clientAttemptId))?.result ?? null);
  },
};
