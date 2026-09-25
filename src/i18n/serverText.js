/**
 * Server entities shown in the UI language. The API sends English names for fixed catalogues
 * (badges, missions) and structured facts for generated text (recommendation reasons, activity);
 * these helpers phrase them with the dictionaries and fall back to the server's English.
 */

/** t(key) returns the key itself when it is missing from every dictionary. */
const lookup = (t, key, vars, fallback) => {
  const value = t(key, vars);
  return value === key ? fallback : value;
};

export const badgeName = (t, badge) => lookup(t, `serverText.badges.${badge.code}.name`, undefined, badge.name);

export const badgeDescription = (t, badge) =>
  lookup(t, `serverText.badges.${badge.code}.description`, undefined, badge.description);

export const missionTitle = (t, mission) => lookup(t, `serverText.missions.${mission.code}.title`, undefined, mission.title);

export const missionDescription = (t, mission) =>
  lookup(t, `serverText.missions.${mission.code}.description`, undefined, mission.description);

/**
 * In English the AI service's own explanation is shown verbatim; in other languages the same facts
 * (reasonParams) are phrased from the dictionary.
 */
export const recommendationReason = (t, language, rec) => {
  if (language === 'en' || !rec.reasonParams) return rec.reason;
  return lookup(t, `serverText.recReasons.${rec.kind}`, rec.reasonParams, rec.reason);
};

/** Headline and detail line of a recent-activity entry. */
export const activityText = (t, item, { withXp = true } = {}) => {
  if (item.name == null) return { title: item.title, detail: item.detail };
  switch (item.type) {
    case 'LESSON':
      return { title: t('serverText.activity.completedLesson', { name: item.name }), detail: item.detail };
    case 'QUIZ':
      return {
        title: item.name,
        detail: withXp && item.xp != null
          ? t('serverText.activity.quizScored', { score: item.score, xp: item.xp })
          : t('serverText.activity.scored', { score: item.score }),
      };
    case 'BADGE':
      return {
        title: t('serverText.activity.unlockedBadge', { name: badgeName(t, item) }),
        detail: badgeDescription(t, { code: item.code, description: item.detail }),
      };
    default:
      return { title: item.title, detail: item.detail };
  }
};

/** Short weekday name from the dictionary (browsers lack Odia date names, so Intl is not used). */
export const weekdayShort = (t, date) => t('serverText.weekdays').split(',')[new Date(date).getDay()];
