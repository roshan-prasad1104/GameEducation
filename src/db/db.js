import { openDB } from 'idb';

/**
 * Local IndexedDB store backing the mock service layer.
 * Schema mirrors (a subset of) the PostgreSQL tables in the brief:
 *   users, students, teachers, subjects, chapters, lessons, quizzes,
 *   quiz_attempts, student_answers, student_progress, gamification_profiles,
 *   badges, student_badges, missions, student_missions, leaderboards,
 *   recommendations, activity_logs, offline_sync_logs
 */
const DB_NAME = 'shikshasetu';
const DB_VERSION = 1;

const STORES = [
  'users', 'students', 'teachers',
  'subjects', 'chapters', 'lessons', 'lesson_translations',
  'quizzes', 'questions', 'quiz_attempts', 'student_answers',
  'student_progress', 'gamification_profiles',
  'badges', 'student_badges', 'missions', 'student_missions',
  'leaderboards', 'recommendations', 'activity_logs', 'offline_sync_logs',
];

let _dbPromise = null;

export const getDB = () => {
  if (_dbPromise) return _dbPromise;
  _dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    },
  });
  return _dbPromise;
};

/** Bulk upsert; entries with a numeric `id` are keyed by id. */
export const putAll = async (storeName, items) => {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  for (const item of items) tx.store.put(item);
  await tx.done;
  return items.length;
};

export const getAll = async (storeName) => {
  const db = await getDB();
  return db.getAll(storeName);
};

export const getOne = async (storeName, id) => {
  const db = await getDB();
  return db.get(storeName, id);
};

export const putOne = async (storeName, item) => {
  const db = await getDB();
  await db.put(storeName, item);
  return item;
};

export const deleteOne = async (storeName, id) => {
  const db = await getDB();
  await db.delete(storeName, id);
};

/** Find by an indexed field (cheap scan; small datasets). */
export const findBy = async (storeName, predicate) => {
  const all = await getAll(storeName);
  return all.filter(predicate);
};

/** Clear all stores. Used by tests/dev reset. */
export const wipeAll = async () => {
  const db = await getDB();
  for (const name of STORES) {
    const tx = db.transaction(name, 'readwrite');
    tx.store.clear();
    await tx.done;
  }
};
