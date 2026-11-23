import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORY_BY_KEY } from '../types/battery';
import type { ActivityBucket, ActivityEvent, PresenceStats } from '../types/battery';
import type { ConnectionState } from '../hooks/useBatterySocket';

interface ActivityMonitorProps {
  connectionState: ConnectionState;
  presence: PresenceStats;
  activities: ActivityEvent[];
  timeline: ActivityBucket[];
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--:--';
  }
}

function describeAnonymousEvent(event: ActivityEvent): string {
  switch (event.type) {
    case 'vote': {
      const cat = event.category ? CATEGORY_BY_KEY[event.category] : null;
      return cat ? `+1 анонімний голос («${cat.shortLabel}»)` : '+1 анонімний голос';
    }
    case 'join':
      return 'Учасник підключився до сесії';
    case 'leave':
      return 'Учасник вийшов із сесії';
    case 'reset':
      return 'Розпочато новий раунд голосування';
  }
}

export const ActivityMonitor: React.FC<ActivityMonitorProps> = ({
  connectionState,
  presence,
  activities,
  timeline,
}) => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const votesLastMinute = useMemo(() => {
    const cutoff = now - 60_000;
    return activities.filter((a) => a.type === 'vote' && a.timestamp >= cutoff).length;
  }, [activities, now]);

  const chartBuckets = useMemo(() => {
    const bucketMs = 15_000;
    const currentBucket = Math.floor(now / bucketMs) * bucketMs;
    const map = new Map<number, ActivityBucket>();
    timeline.forEach((b) => map.set(b.bucketStart, b));

    const slots: ActivityBucket[] = [];
    for (let i = 11; i >= 0; i--) {
      const ts = currentBucket - i * bucketMs;
      slots.push(map.get(ts) || { bucketStart: ts, votes: 0, actions: 0 });
    }
    return slots;
  }, [timeline, now]);

  const maxBucketActions = useMemo(
    () => Math.max(3, ...chartBuckets.map((b) => b.actions)),
    [chartBuckets]
  );

  const recentEvents = activities.slice(0, 3);

  return (
    <section
      aria-label="Процес голосування та активність у реальному часі"
      className="bg-[#0b1544]/90 border-[3px] border-[#10163a] rounded-2xl px-3.5 py-2.5 flex flex-col gap-2"
      style={{ boxShadow: 'inset 0 2px 0 rgba(99, 179, 255, 0.18), 0 4px 0 #090d24' }}
    >
      {/* Верхній компактний рядок: заклик + реальні метрики онлайну */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="text-[#ffeaa7] uppercase tracking-wide">Твоя думка важлива!</span>
          <span className="text-sky-100/90">Тут немає неправильних відповідей.</span>
        </div>

        <div className="flex items-center gap-2.5 font-mono-num text-[11px] sm:text-xs font-extrabold text-sky-100 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-sans">
              {connectionState === 'connected' ? 'Наживо' : 'З’єднання...'}
            </span>
          </span>
          <span className="text-sky-400/50" aria-hidden="true">
            ·
          </span>
          <span>Онлайн: {presence.onlineCount}</span>
          <span className="text-sky-400/50" aria-hidden="true">
            ·
          </span>
          <span className="text-emerald-300">Активних: {presence.activeCount}</span>
          <span className="text-sky-400/50" aria-hidden="true">
            ·
          </span>
          <span className="text-amber-300">Темп: {votesLastMinute}/хв</span>
        </div>
      </div>

      {/* Нижній компактний блок: жива стрічка анонімних подій + міні-графік активності */}
      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-2.5 items-stretch pt-1.5 border-t border-white/10">
        <div className="bg-[#080f30]/80 border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-col justify-center">
          {recentEvents.length === 0 ? (
            <div className="text-[11px] font-bold text-sky-200/70 py-1">
              Очікування перших анонімних голосів у реальному часі...
            </div>
          ) : (
            <ul className="space-y-1">
              {recentEvents.map((act) => {
                const cat = act.category ? CATEGORY_BY_KEY[act.category] : null;
                return (
                  <li
                    key={act.id}
                    className="flex items-center justify-between gap-2 text-[11px] font-bold"
                  >
                    <span className="flex items-center gap-1.5 min-w-0 text-sky-100 truncate">
                      <span
                        className="w-2 h-2 min-w-[8px] rounded-full"
                        style={{ backgroundColor: cat ? cat.topColor : '#38bdf8' }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{describeAnonymousEvent(act)}</span>
                    </span>
                    <span className="font-mono-num text-[10px] text-sky-300/75 shrink-0">
                      {formatTime(act.timestamp)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-[#080f30]/80 border border-white/10 rounded-xl px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-extrabold text-sky-200/80 mb-1">
            <span>Пульс активності (3 хв)</span>
            <span className="font-mono-num text-[#ffeaa7]">
              Проголосували: {presence.votedOnlineCount}/{presence.onlineCount}
            </span>
          </div>
          <div className="h-7 flex items-end gap-1">
            {chartBuckets.map((bucket) => {
              const totalH = Math.round((bucket.actions / maxBucketActions) * 100);
              const votesH = Math.round((bucket.votes / maxBucketActions) * 100);
              return (
                <div
                  key={bucket.bucketStart}
                  className="flex-1 h-full flex items-end justify-center"
                  title={`${formatTime(bucket.bucketStart)}: ${bucket.votes} гол., ${bucket.actions} дій`}
                >
                  {bucket.actions > 0 ? (
                    <div
                      className="w-full rounded-t-sm bg-sky-400/55 relative overflow-hidden"
                      style={{ height: `${Math.max(18, totalH)}%` }}
                    >
                      {bucket.votes > 0 && (
                        <div
                          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-amber-500 to-yellow-300"
                          style={{
                            height: `${Math.min(
                              100,
                              Math.round((votesH / Math.max(18, totalH)) * 100)
                            )}%`,
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-[2px] rounded bg-white/10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
