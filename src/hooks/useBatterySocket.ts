import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ActivityBucket,
  ActivityEvent,
  PresenceStats,
  SessionState,
  UserStatus,
  VoteCategory,
  VotesMap,
} from '../types/battery';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting';

interface UseBatterySocketOptions {
  roomId: string;
  onVoteConfirmed?: (category: VoteCategory) => void;
}

const VOTER_TOKEN_STORAGE = 'battery_anon_voter_token_v1';
const TAB_CONN_STORAGE = 'battery_anon_tab_conn_v1';

function createRandomToken(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}-${Date.now()}`;
}

function getOrCreateVoterToken(): string {
  try {
    const existing = localStorage.getItem(VOTER_TOKEN_STORAGE);
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) {
      return existing;
    }
    const generated = createRandomToken('voter');
    localStorage.setItem(VOTER_TOKEN_STORAGE, generated);
    return generated;
  } catch {
    return createRandomToken('voter');
  }
}

function getOrCreateConnectionId(): string {
  try {
    const existing = sessionStorage.getItem(TAB_CONN_STORAGE);
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) {
      return existing;
    }
    const generated = createRandomToken('tab');
    sessionStorage.setItem(TAB_CONN_STORAGE, generated);
    return generated;
  } catch {
    return createRandomToken('tab');
  }
}

const EMPTY_PRESENCE: PresenceStats = {
  onlineCount: 0,
  activeCount: 0,
  idleCount: 0,
  votedOnlineCount: 0,
  focusCounts: {
    support: 0,
    direction: 0,
    ideas: 0,
    transform: 0,
  },
};

export function useBatterySocket({
  roomId,
  onVoteConfirmed,
}: UseBatterySocketOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [roundId, setRoundId] = useState<number>(1);
  const [votes, setVotes] = useState<VotesMap>({
    support: 0,
    direction: 0,
    ideas: 0,
    transform: 0,
  });
  const [presence, setPresence] = useState<PresenceStats>(EMPTY_PRESENCE);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [timeline, setTimeline] = useState<ActivityBucket[]>([]);
  const [lastActiveVote, setLastActiveVote] = useState<{
    category: VoteCategory;
    key: number;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const voterTokenRef = useRef<string>(getOrCreateVoterToken());
  const connectionIdRef = useRef<string>(getOrCreateConnectionId());
  const voteQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingOptimisticCountRef = useRef<number>(0);
  const onVoteConfirmedRef = useRef(onVoteConfirmed);
  onVoteConfirmedRef.current = onVoteConfirmed;

  const applyServerState = useCallback((state: SessionState) => {
    if (!state) return;
    setRoundId(state.roundId || 1);
    if (state.votes && pendingOptimisticCountRef.current === 0) {
      setVotes(state.votes);
    }
    if (state.presence) setPresence(state.presence);
    if (Array.isArray(state.activities)) setActivities(state.activities);
    if (Array.isArray(state.timeline)) setTimeline(state.timeline);
  }, []);

  const fetchStateSnapshot = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/state?room=${encodeURIComponent(roomId)}&voterToken=${encodeURIComponent(
          voterTokenRef.current
        )}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = (await res.json()) as SessionState;
      if (mountedRef.current) {
        applyServerState(data);
      }
    } catch {
      // ignore transient fetch errors
    }
  }, [applyServerState, roomId]);

  const sendMessage = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    void fetchStateSnapshot();
  }, [fetchStateSnapshot]);

  useEffect(() => {
    if (connectionState === 'connected') return;
    const interval = window.setInterval(() => {
      void fetchStateSnapshot();
    }, 2500);
    return () => window.clearInterval(interval);
  }, [connectionState, fetchStateSnapshot]);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?room=${encodeURIComponent(roomId)}`;

      setConnectionState(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        setConnectionState('connected');

        ws.send(
          JSON.stringify({
            type: 'hello',
            payload: {
              voterToken: voterTokenRef.current,
              connectionId: connectionIdRef.current,
            },
          })
        );

        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
        }
        pingTimerRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', payload: {} }));
          }
        }, 25_000);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        let msg: { type?: string; payload?: any };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!msg || typeof msg.type !== 'string') return;
        const payload = msg.payload || {};

        if (msg.type === 'state:init') {
          applyServerState(payload as SessionState);
          return;
        }

        if (msg.type === 'vote:recorded') {
          if (payload.votes && pendingOptimisticCountRef.current === 0) {
            setVotes(payload.votes);
          }
          if (payload.presence) setPresence(payload.presence);
          if (payload.activity) {
            const act: ActivityEvent = payload.activity;
            setActivities((prev) => {
              if (prev.some((item) => item.id === act.id)) return prev;
              return [act, ...prev].slice(0, 40);
            });
            if (act.category) {
              setLastActiveVote({ category: act.category, key: Date.now() });
            }
          }
          if (payload.timeline) {
            setTimeline(payload.timeline);
          }
          return;
        }

        if (msg.type === 'presence:updated') {
          if (payload.presence) setPresence(payload.presence);
          if (payload.activity) {
            const act: ActivityEvent = payload.activity;
            setActivities((prev) => {
              if (prev.some((item) => item.id === act.id)) return prev;
              return [act, ...prev].slice(0, 40);
            });
          }
          if (payload.timeline) setTimeline(payload.timeline);
          return;
        }

        if (msg.type === 'session:reset') {
          pendingOptimisticCountRef.current = 0;
          if (typeof payload.roundId === 'number') setRoundId(payload.roundId);
          if (payload.votes) setVotes(payload.votes);
          if (payload.presence) setPresence(payload.presence);
          if (payload.activity) {
            const act: ActivityEvent = payload.activity;
            setActivities((prev) => {
              if (prev.some((item) => item.id === act.id)) return prev;
              return [act, ...prev].slice(0, 40);
            });
          }
          if (payload.timeline) setTimeline(payload.timeline);
        }
      };

      ws.onclose = () => {
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        if (!mountedRef.current) return;
        setConnectionState('reconnecting');
        const delay = Math.min(5000, 800 * Math.pow(1.4, reconnectAttemptsRef.current));
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [applyServerState, roomId]);

  useEffect(() => {
    let currentStatus: UserStatus = document.hidden ? 'idle' : 'active';
    let idleTimeout: number | null = null;
    let lastSignalAt = 0;

    const pushStatus = (nextStatus: UserStatus) => {
      const now = Date.now();
      if (nextStatus === currentStatus && now - lastSignalAt < 10_000) return;
      currentStatus = nextStatus;
      lastSignalAt = now;
      sendMessage('presence:status', { status: nextStatus });
    };

    const resetIdleTimer = () => {
      if (document.hidden) return;
      pushStatus('active');
      if (idleTimeout) window.clearTimeout(idleTimeout);
      idleTimeout = window.setTimeout(() => {
        pushStatus('idle');
      }, 30_000);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (idleTimeout) window.clearTimeout(idleTimeout);
        pushStatus('idle');
      } else {
        resetIdleTimer();
      }
    };

    resetIdleTimer();
    window.addEventListener('pointerdown', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer, { passive: true });
    window.addEventListener('mousemove', resetIdleTimer, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (idleTimeout) window.clearTimeout(idleTimeout);
      window.removeEventListener('pointerdown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [sendMessage]);

  // Multi-click voting with optimistic increment + sequential server queue so fast clicks never get dropped or overwritten
  const castVote = useCallback(
    (category: VoteCategory) => {
      const eventId = createRandomToken('vote');
      pendingOptimisticCountRef.current += 1;

      setVotes((prev) => ({
        ...prev,
        [category]: prev[category] + 1,
      }));
      setLastActiveVote({ category, key: Date.now() });
      onVoteConfirmedRef.current?.(category);

      voteQueueRef.current = voteQueueRef.current.then(async () => {
        try {
          const res = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              voterToken: voterTokenRef.current,
              category,
              eventId,
            }),
          });
          const data = await res.json();
          pendingOptimisticCountRef.current = Math.max(0, pendingOptimisticCountRef.current - 1);
          if (data?.state && pendingOptimisticCountRef.current === 0 && mountedRef.current) {
            applyServerState(data.state as SessionState);
          }
        } catch {
          pendingOptimisticCountRef.current = Math.max(0, pendingOptimisticCountRef.current - 1);
          sendMessage('vote:cast', { eventId, category });
        }
      });
    },
    [applyServerState, roomId, sendMessage]
  );

  const setFocusedCategory = useCallback(
    (category: VoteCategory | null) => {
      sendMessage('presence:focus', { category });
    },
    [sendMessage]
  );

  const resetSession = useCallback(async () => {
    const eventId = createRandomToken('reset');
    pendingOptimisticCountRef.current = 0;
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, eventId }),
      });
      const data = await res.json();
      if (data?.state) {
        applyServerState(data.state as SessionState);
      }
    } catch {
      sendMessage('session:reset', { eventId });
    }
  }, [applyServerState, roomId, sendMessage]);

  return {
    connectionState,
    roundId,
    votes,
    presence,
    activities,
    timeline,
    lastActiveVote,
    castVote,
    setFocusedCategory,
    resetSession,
  };
}
