import { http, ApiError } from './api';
import { offlineStore } from './offlineStore';

/**
 * Replays queued offline actions in order. Each action carries an idempotency key
 * (lesson id / clientAttemptId), so re-sending after a partial failure is safe.
 *
 * Returns { synced, failed, remaining, results } where results are graded quiz attempts.
 */
export async function flushOutbox(owner) {
  const summary = { synced: 0, failed: 0, remaining: 0, results: [], errors: [] };
  if (!owner) return summary;
  const actions = (await offlineStore.pending(owner)).sort((a, b) => a.id - b.id);

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    try {
      if (action.type === 'LESSON_COMPLETE') {
        await http.post(`/lessons/${action.lessonId}/complete`, { completedAt: action.completedAt, offline: true });
      } else if (action.type === 'QUIZ_SUBMIT') {
        const result = await http.post(`/quizzes/${action.quizId}/submit`, { ...action.payload, offline: true });
        await offlineStore.saveResult(action.payload.clientAttemptId, result);
        summary.results.push(result);
      }
      await offlineStore.removeAction(action.id);
      summary.synced++;
    } catch (e) {
      if (e instanceof ApiError && (e.isNetwork || e.status === 401 || e.status >= 500)) {
        // Still offline, signed out or server trouble: stop and retry later, keeping order.
        await offlineStore.updateAction({ ...action, attempts: (action.attempts ?? 0) + 1, lastError: e.message });
        summary.remaining = actions.length - i;
        return summary;
      }
      // The server rejected the action (e.g. content was removed). Drop it so it cannot block the queue.
      await offlineStore.removeAction(action.id);
      summary.failed++;
      summary.errors.push(e?.message ?? 'Unknown error');
    }
  }
  return summary;
}

export const pendingCount = async (owner) => (owner ? (await offlineStore.pending(owner)).length : 0);
