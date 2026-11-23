export type VoteCategory = 'support' | 'direction' | 'ideas' | 'transform';

export type VotesMap = Record<VoteCategory, number>;

export type UserStatus = 'active' | 'idle';

export type ActivityEventType = 'join' | 'leave' | 'vote' | 'reset';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  category?: VoteCategory;
  timestamp: number;
}

export interface ActivityBucket {
  bucketStart: number;
  votes: number;
  actions: number;
}

export interface PresenceStats {
  onlineCount: number;
  activeCount: number;
  idleCount: number;
  votedOnlineCount: number;
  focusCounts: Record<VoteCategory, number>;
}

export interface SessionState {
  roomId: string;
  roundId: number;
  votes: VotesMap;
  presence: PresenceStats;
  activities: ActivityEvent[];
  timeline: ActivityBucket[];
  hasVoted: boolean;
  myVote: VoteCategory | null;
  serverTime: number;
}

export interface CategoryMeta {
  key: VoteCategory;
  badgeNumber: string;
  keyHint: string;
  weight: number;
  label: string;
  shortLabel: string;
  topColor: string;
  botColor: string;
  dotColor: string;
}

export const CATEGORIES_LIST: CategoryMeta[] = [
  {
    key: 'support',
    badgeNumber: '01',
    keyHint: '1',
    weight: 0,
    label: 'Готовий (-а) до змін, але потрібна підтримка',
    shortLabel: 'Потрібна підтримка',
    topColor: '#ff4757',
    botColor: '#c0182b',
    dotColor: '#ff4757',
  },
  {
    key: 'direction',
    badgeNumber: '02',
    keyHint: '2',
    weight: 33,
    label: 'Визначаю напрям у змінах',
    shortLabel: 'Визначаю напрям',
    topColor: '#ffa502',
    botColor: '#d35400',
    dotColor: '#ffa502',
  },
  {
    key: 'ideas',
    badgeNumber: '03',
    keyHint: '3',
    weight: 100,
    label: 'Бачу нові ідеї, втілю у життя',
    shortLabel: 'Нові ідеї',
    topColor: '#2ed573',
    botColor: '#107c3e',
    dotColor: '#2ed573',
  },
  {
    key: 'transform',
    badgeNumber: '04',
    keyHint: '4',
    weight: 67,
    label: 'Готовий до змін, трансформуюся',
    shortLabel: 'Трансформуюся',
    topColor: '#a55eea',
    botColor: '#5f27cd',
    dotColor: '#a55eea',
  },
];

export const CATEGORY_BY_KEY: Record<VoteCategory, CategoryMeta> = {
  support: CATEGORIES_LIST[0],
  direction: CATEGORIES_LIST[1],
  ideas: CATEGORIES_LIST[2],
  transform: CATEGORIES_LIST[3],
};

export function calculateTeamCharge(votes: VotesMap): { total: number; charge: number } {
  const total = votes.support + votes.direction + votes.transform + votes.ideas;
  if (total === 0) {
    return { total: 0, charge: 0 };
  }
  const weightedSum =
    votes.support * 0 +
    votes.direction * 33 +
    votes.transform * 67 +
    votes.ideas * 100;
  return {
    total,
    charge: Math.round(weightedSum / total),
  };
}

export function getBatteryAppearance(charge: number): {
  color: string;
  color2: string;
  glow: string;
  comment: string;
  levelLabel: string;
} {
  if (charge <= 25) {
    return {
      color: '#ff3b30',
      color2: '#ff7675',
      glow: 'rgba(255, 59, 48, 0.5)',
      comment: 'Потрібно більше підтримки на старті змін',
      levelLabel: 'Стартовий рівень',
    };
  }
  if (charge <= 50) {
    return {
      color: '#f59e0b',
      color2: '#fde047',
      glow: 'rgba(245, 158, 11, 0.5)',
      comment: 'Досліджуємо можливості, переходимо до дій',
      levelLabel: 'Пошуковий рівень',
    };
  }
  if (charge <= 75) {
    return {
      color: '#0ea5e9',
      color2: '#7dd3fc',
      glow: 'rgba(14, 165, 233, 0.55)',
      comment: 'Команда набирає енергію та готова до експериментів',
      levelLabel: 'Активний рівень',
    };
  }
  return {
    color: '#10b981',
    color2: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.6)',
    comment: 'Потужний заряд! Відкриті до освітніх трансформацій',
    levelLabel: 'Максимальний заряд',
  };
}
