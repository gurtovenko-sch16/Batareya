import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';

type VoteCategory = 'support' | 'direction' | 'ideas' | 'transform';
type UserStatus = 'active' | 'idle';
type ActivityEventType = 'join' | 'leave' | 'vote' | 'reset';

interface VotesMap {
  support: number;
  direction: number;
  ideas: number;
  transform: number;
}

interface ConnectionMeta {
  connectionId: string;
  voterToken: string;
  status: UserStatus;
  focusedChoice: VoteCategory | null;
  lastActiveAt: number;
}

interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  category?: VoteCategory;
  timestamp: number;
}

interface ActivityBucket {
  bucketStart: number;
  votes: number;
  actions: number;
}

interface RoomData {
  roomId: string;
  roundId: number;
  votes: VotesMap;
  votedTokens: Map<string, VoteCategory>;
  connections: Map<WebSocket, ConnectionMeta>;
  activities: ActivityEvent[];
  timeline: ActivityBucket[];
  processedEventIds: Set<string>;
}

interface PersistedRoomSnapshot {
  roundId: number;
  votes: VotesMap;
  votedTokens: Array<[string, VoteCategory]>;
  activities: ActivityEvent[];
  timeline: ActivityBucket[];
}

const VALID_CATEGORIES: VoteCategory[] = ['support', 'direction', 'ideas', 'transform'];
const BUCKET_MS = 15_000;
const MAX_TIMELINE_BUCKETS = 16;
const MAX_ACTIVITIES = 40;
const MAX_PROCESSED_IDS = 500;

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STATE_FILE = path.resolve(DATA_DIR, 'battery-state.json');

const rooms = new Map<string, RoomData>();

function sanitizeRoomId(raw: unknown): string {
  if (typeof raw !== 'string') return 'main';
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  return cleaned || 'main';
}

function sanitizeToken(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim();
  if (/^[a-zA-Z0-9_-]{8,80}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

function isValidCategory(val: unknown): val is VoteCategory {
  return typeof val === 'string' && VALID_CATEGORIES.includes(val as VoteCategory);
}

function loadPersistedState(): Record<string, PersistedRoomSnapshot> {
  try {
    if (!fs.existsSync(STATE_FILE)) return {};
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, PersistedRoomSnapshot>;
  } catch {
    return {};
  }
}

const persistedSnapshots = loadPersistedState();
let persistTimer: NodeJS.Timeout | null = null;

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const out: Record<string, PersistedRoomSnapshot> = {};
      for (const [roomId, room] of rooms.entries()) {
        out[roomId] = {
          roundId: room.roundId,
          votes: { ...room.votes },
          votedTokens: Array.from(room.votedTokens.entries()),
          activities: room.activities.slice(0, MAX_ACTIVITIES),
          timeline: room.timeline.slice(-MAX_TIMELINE_BUCKETS),
        };
      }
      const tempFile = `${STATE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(out, null, 2), 'utf-8');
      fs.renameSync(tempFile, STATE_FILE);
    } catch (err) {
      console.error('Failed to persist room state:', err);
    }
  }, 350);
}

function getOrCreateRoom(rawRoomId: unknown): RoomData {
  const roomId = sanitizeRoomId(rawRoomId);
  let room = rooms.get(roomId);
  if (room) return room;

  const saved = persistedSnapshots[roomId];
  const votes: VotesMap = {
    support: Number.isInteger(saved?.votes?.support) && saved.votes.support >= 0 ? saved.votes.support : 0,
    direction: Number.isInteger(saved?.votes?.direction) && saved.votes.direction >= 0 ? saved.votes.direction : 0,
    ideas: Number.isInteger(saved?.votes?.ideas) && saved.votes.ideas >= 0 ? saved.votes.ideas : 0,
    transform: Number.isInteger(saved?.votes?.transform) && saved.votes.transform >= 0 ? saved.votes.transform : 0,
  };

  const votedTokens = new Map<string, VoteCategory>();
  if (Array.isArray(saved?.votedTokens)) {
    for (const entry of saved.votedTokens) {
      if (Array.isArray(entry) && entry.length === 2) {
        const tok = sanitizeToken(entry[0]);
        if (tok && isValidCategory(entry[1])) {
          votedTokens.set(tok, entry[1]);
        }
      }
    }
  }

  room = {
    roomId,
    roundId: typeof saved?.roundId === 'number' && saved.roundId >= 1 ? saved.roundId : 1,
    votes,
    votedTokens,
    connections: new Map(),
    activities: Array.isArray(saved?.activities) ? saved.activities.slice(0, MAX_ACTIVITIES) : [],
    timeline: Array.isArray(saved?.timeline) ? saved.timeline.slice(-MAX_TIMELINE_BUCKETS) : [],
    processedEventIds: new Set(),
  };

  rooms.set(roomId, room);
  return room;
}

function recordBucket(room: RoomData, isVote: boolean, now: number): ActivityBucket {
  const bucketStart = Math.floor(now / BUCKET_MS) * BUCKET_MS;
  let bucket = room.timeline.find((b) => b.bucketStart === bucketStart);
  if (!bucket) {
    bucket = { bucketStart, votes: 0, actions: 0 };
    room.timeline.push(bucket);
    if (room.timeline.length > MAX_TIMELINE_BUCKETS) {
      room.timeline.splice(0, room.timeline.length - MAX_TIMELINE_BUCKETS);
    }
  }
  bucket.actions += 1;
  if (isVote) {
    bucket.votes += 1;
  }
  return bucket;
}

function pushActivity(room: RoomData, event: ActivityEvent): void {
  room.activities.unshift(event);
  if (room.activities.length > MAX_ACTIVITIES) {
    room.activities.length = MAX_ACTIVITIES;
  }
}

function trackProcessedEvent(room: RoomData, eventId: string): boolean {
  if (room.processedEventIds.has(eventId)) {
    return false;
  }
  room.processedEventIds.add(eventId);
  if (room.processedEventIds.size > MAX_PROCESSED_IDS) {
    const first = room.processedEventIds.values().next().value;
    if (first !== undefined) {
      room.processedEventIds.delete(first);
    }
  }
  return true;
}

function computePresenceStats(room: RoomData) {
  let onlineCount = 0;
  let activeCount = 0;
  let idleCount = 0;
  const votedOnlineTokens = new Set<string>();
  const focusCounts: Record<VoteCategory, number> = {
    support: 0,
    direction: 0,
    ideas: 0,
    transform: 0,
  };

  for (const meta of room.connections.values()) {
    onlineCount += 1;
    if (meta.status === 'active') {
      activeCount += 1;
    } else {
      idleCount += 1;
    }
    if (room.votedTokens.has(meta.voterToken)) {
      votedOnlineTokens.add(meta.voterToken);
    }
    if (meta.focusedChoice) {
      focusCounts[meta.focusedChoice] += 1;
    }
  }

  return {
    onlineCount,
    activeCount,
    idleCount,
    votedOnlineCount: votedOnlineTokens.size,
    focusCounts,
  };
}

function serializeRoomState(room: RoomData, voterToken?: string | null) {
  const myVote = voterToken ? room.votedTokens.get(voterToken) || null : null;
  return {
    roomId: room.roomId,
    roundId: room.roundId,
    votes: { ...room.votes },
    presence: computePresenceStats(room),
    activities: room.activities,
    timeline: room.timeline,
    hasVoted: Boolean(myVote),
    myVote,
    serverTime: Date.now(),
  };
}

function broadcastToRoom(room: RoomData, message: unknown, excludeSocket?: WebSocket): void {
  const payload = JSON.stringify(message);
  for (const client of room.connections.keys()) {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      activeRooms: rooms.size,
      timestamp: Date.now(),
    });
  });

  app.get('/api/state', (req, res) => {
    const room = getOrCreateRoom(req.query.room);
    const token = sanitizeToken(req.query.voterToken);
    res.json(serializeRoomState(room, token));
  });

  app.post('/api/vote', (req, res) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const room = getOrCreateRoom(body.roomId);
    const voterToken = sanitizeToken(body.voterToken);
    const category = body.category;

    if (!isValidCategory(category)) {
      res.status(400).json({ error: 'Invalid vote payload' });
      return;
    }

    const effectiveToken = voterToken || crypto.randomUUID();
    const eventId =
      typeof body.eventId === 'string' && body.eventId.length > 0
        ? body.eventId.slice(0, 80)
        : crypto.randomUUID();
    const now = Date.now();

    if (trackProcessedEvent(room, eventId)) {
      room.votes[category] += 1;
      room.votedTokens.set(effectiveToken, category);
      const activity: ActivityEvent = {
        id: eventId,
        type: 'vote',
        category,
        timestamp: now,
      };
      pushActivity(room, activity);
      recordBucket(room, true, now);
      schedulePersist();

      broadcastToRoom(room, {
        type: 'vote:recorded',
        payload: {
          votes: { ...room.votes },
          presence: computePresenceStats(room),
          activity,
          timeline: room.timeline,
          category,
        },
      });
    }

    res.json({
      ok: true,
      myVote: category,
      state: serializeRoomState(room, effectiveToken),
    });
  });

  app.post('/api/reset', (req, res) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const room = getOrCreateRoom(body.roomId);
    const eventId =
      typeof body.eventId === 'string' && body.eventId.length > 0
        ? body.eventId.slice(0, 80)
        : crypto.randomUUID();
    const now = Date.now();

    if (trackProcessedEvent(room, eventId)) {
      room.roundId += 1;
      room.votes = { support: 0, direction: 0, ideas: 0, transform: 0 };
      room.votedTokens.clear();

      const activity: ActivityEvent = {
        id: eventId,
        type: 'reset',
        timestamp: now,
      };
      pushActivity(room, activity);
      recordBucket(room, false, now);
      schedulePersist();

      broadcastToRoom(room, {
        type: 'session:reset',
        payload: {
          roundId: room.roundId,
          votes: { ...room.votes },
          presence: computePresenceStats(room),
          activity,
          timeline: room.timeline,
        },
      });
    }

    res.json({
      ok: true,
      state: serializeRoomState(room, null),
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const roomId = sanitizeRoomId(reqUrl.searchParams.get('room'));
    const room = getOrCreateRoom(roomId);
    let connMeta: ConnectionMeta | null = null;

    const send = (msg: unknown) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    };

    ws.on('message', (raw) => {
      let msg: { type?: string; payload?: Record<string, unknown> };
      try {
        msg = JSON.parse(raw.toString()) as { type?: string; payload?: Record<string, unknown> };
      } catch {
        return;
      }

      if (!msg || typeof msg.type !== 'string') return;
      const payload = (msg.payload && typeof msg.payload === 'object' ? msg.payload : {}) as Record<
        string,
        unknown
      >;
      const now = Date.now();

      if (msg.type === 'ping') {
        send({ type: 'pong', payload: { serverTime: now } });
        return;
      }

      if (msg.type === 'hello') {
        const voterToken = sanitizeToken(payload.voterToken) || crypto.randomUUID();
        const connectionId = sanitizeToken(payload.connectionId) || crypto.randomUUID();

        // Replace stale socket with same tab connectionId if reconnecting
        for (const [otherSocket, otherMeta] of room.connections.entries()) {
          if (otherMeta.connectionId === connectionId && otherSocket !== ws) {
            room.connections.delete(otherSocket);
            try {
              otherSocket.close(1000, 'Replaced by reconnected tab');
            } catch {
              // ignore
            }
          }
        }

        const isNewJoin = !connMeta;
        connMeta = {
          connectionId,
          voterToken,
          status: 'active',
          focusedChoice: null,
          lastActiveAt: now,
        };
        room.connections.set(ws, connMeta);

        let joinActivity: ActivityEvent | undefined;
        if (isNewJoin) {
          joinActivity = {
            id: crypto.randomUUID(),
            type: 'join',
            timestamp: now,
          };
          pushActivity(room, joinActivity);
          recordBucket(room, false, now);
          schedulePersist();
        }

        send({
          type: 'state:init',
          payload: serializeRoomState(room, voterToken),
        });

        broadcastToRoom(
          room,
          {
            type: 'presence:updated',
            payload: {
              presence: computePresenceStats(room),
              activity: joinActivity,
              timeline: room.timeline,
            },
          },
          ws
        );
        return;
      }

      if (!connMeta) return;

      if (msg.type === 'vote:cast') {
        const category = payload.category;
        if (!isValidCategory(category)) return;

        const eventId =
          typeof payload.eventId === 'string' && payload.eventId.length > 0
            ? payload.eventId.slice(0, 80)
            : crypto.randomUUID();

        if (!trackProcessedEvent(room, eventId)) {
          return;
        }

        room.votes[category] += 1;
        room.votedTokens.set(connMeta.voterToken, category);
        connMeta.lastActiveAt = now;
        connMeta.status = 'active';
        connMeta.focusedChoice = null;

        const activity: ActivityEvent = {
          id: eventId,
          type: 'vote',
          category,
          timestamp: now,
        };

        pushActivity(room, activity);
        recordBucket(room, true, now);
        schedulePersist();

        // Confirm directly to the voter with their recorded vote
        send({
          type: 'vote:confirmed',
          payload: {
            myVote: category,
          },
        });

        // Also update any other open tabs sharing the same voterToken in the same browser
        for (const [sock, meta] of room.connections.entries()) {
          if (sock !== ws && meta.voterToken === connMeta.voterToken && sock.readyState === WebSocket.OPEN) {
            sock.send(
              JSON.stringify({
                type: 'vote:confirmed',
                payload: { myVote: category },
              })
            );
          }
        }

        broadcastToRoom(room, {
          type: 'vote:recorded',
          payload: {
            votes: { ...room.votes },
            presence: computePresenceStats(room),
            activity,
            timeline: room.timeline,
            category,
          },
        });
        return;
      }

      if (msg.type === 'presence:status') {
        const nextStatus = payload.status === 'idle' ? 'idle' : 'active';
        if (connMeta.status !== nextStatus) {
          connMeta.status = nextStatus;
          if (nextStatus === 'active') {
            connMeta.lastActiveAt = now;
          }
          broadcastToRoom(room, {
            type: 'presence:updated',
            payload: {
              presence: computePresenceStats(room),
            },
          });
        }
        return;
      }

      if (msg.type === 'presence:focus') {
        const nextChoice = isValidCategory(payload.category) ? payload.category : null;
        if (connMeta.focusedChoice !== nextChoice) {
          connMeta.focusedChoice = nextChoice;
          connMeta.lastActiveAt = now;
          connMeta.status = 'active';
          broadcastToRoom(room, {
            type: 'presence:updated',
            payload: {
              presence: computePresenceStats(room),
            },
          });
        }
        return;
      }

      if (msg.type === 'session:reset') {
        const eventId =
          typeof payload.eventId === 'string' && payload.eventId.length > 0
            ? payload.eventId.slice(0, 80)
            : crypto.randomUUID();
        if (!trackProcessedEvent(room, eventId)) return;

        room.roundId += 1;
        room.votes = { support: 0, direction: 0, ideas: 0, transform: 0 };
        room.votedTokens.clear();
        connMeta.lastActiveAt = now;

        const activity: ActivityEvent = {
          id: eventId,
          type: 'reset',
          timestamp: now,
        };
        pushActivity(room, activity);
        recordBucket(room, false, now);
        schedulePersist();

        broadcastToRoom(room, {
          type: 'session:reset',
          payload: {
            roundId: room.roundId,
            votes: { ...room.votes },
            presence: computePresenceStats(room),
            activity,
            timeline: room.timeline,
          },
        });
      }
    });

    ws.on('close', () => {
      if (!room.connections.has(ws)) return;
      room.connections.delete(ws);

      const leaveActivity: ActivityEvent = {
        id: crypto.randomUUID(),
        type: 'leave',
        timestamp: Date.now(),
      };
      pushActivity(room, leaveActivity);
      recordBucket(room, false, Date.now());
      schedulePersist();

      broadcastToRoom(room, {
        type: 'presence:updated',
        payload: {
          presence: computePresenceStats(room),
          activity: leaveActivity,
          timeline: room.timeline,
        },
      });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Battery of Changes anonymous real-time server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
