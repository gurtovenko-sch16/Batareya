import React, { useEffect, useState } from 'react';
import { CATEGORIES_LIST } from '../types/battery';
import type { PresenceStats, VoteCategory } from '../types/battery';
import { BatteryIllustration } from './BatteryIllustrations';

interface BatteryCardsProps {
  presence: PresenceStats;
  lastActiveVote: { category: VoteCategory; key: number } | null;
  onVote: (category: VoteCategory) => void;
  onFocusChange: (category: VoteCategory | null) => void;
}

export const BatteryCards: React.FC<BatteryCardsProps> = ({
  presence,
  lastActiveVote,
  onVote,
  onFocusChange,
}) => {
  const [pulsedCard, setPulsedCard] = useState<VoteCategory | null>(null);
  const [remoteRipple, setRemoteRipple] = useState<{ category: VoteCategory; key: number } | null>(
    null
  );

  useEffect(() => {
    if (!lastActiveVote) return;
    setRemoteRipple(lastActiveVote);
    const timer = window.setTimeout(() => {
      setRemoteRipple((curr) => (curr?.key === lastActiveVote.key ? null : curr));
    }, 550);
    return () => window.clearTimeout(timer);
  }, [lastActiveVote]);

  const handleTrigger = (key: VoteCategory) => {
    setPulsedCard(key);
    window.setTimeout(() => {
      setPulsedCard((curr) => (curr === key ? null : curr));
    }, 150);
    onVote(key);
  };

  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch"
      aria-label="Варіанти відповіді"
    >
      {CATEGORIES_LIST.map((cat) => {
        const isPulsed = pulsedCard === cat.key;
        const hasRemoteRipple = remoteRipple?.category === cat.key;
        const viewersCount = presence.focusCounts[cat.key] || 0;

        return (
          <div
            key={cat.key}
            role="button"
            tabIndex={0}
            data-key={cat.key}
            onClick={() => handleTrigger(cat.key)}
            onMouseEnter={() => onFocusChange(cat.key)}
            onMouseLeave={() => onFocusChange(null)}
            onFocus={() => onFocusChange(cat.key)}
            onBlur={() => onFocusChange(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTrigger(cat.key);
              }
            }}
            className={`group relative flex flex-col items-center justify-between rounded-[22px] border-[3.5px] border-[#10163a] px-2.5 pt-2.5 pb-3 cursor-pointer select-none text-center text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 ${
              isPulsed
                ? 'translate-y-1 scale-[0.97]'
                : 'hover:-translate-y-1 hover:brightness-105'
            }`}
            style={{
              background: `linear-gradient(180deg, ${cat.topColor} 0%, ${cat.botColor} 100%)`,
              boxShadow:
                '0 6px 0 #10163a, 0 10px 18px rgba(0, 0, 0, 0.35), inset 0 3px 0 rgba(255, 255, 255, 0.35)',
            }}
          >
            {/* Пульсація реального голосу */}
            {hasRemoteRipple && (
              <span
                key={remoteRipple.key}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[18px] border-4 border-yellow-200 animate-vote-ripple"
              />
            )}

            {/* Верхній рядок картки: номер 01-04 + зірочка / анонімний фокус */}
            <div className="w-full flex items-center justify-between gap-1 mb-1.5">
              <span className="font-mono-num bg-white text-[#10163a] border-2 border-[#10163a] rounded-md px-1.5 py-0.5 text-[11px] font-black leading-none">
                {cat.badgeNumber}
              </span>

              {viewersCount > 0 ? (
                <span
                  className="text-[10px] font-black bg-[#10163a]/85 text-yellow-200 rounded-md px-1.5 py-0.5 leading-none"
                  title="Кількість учасників, які зараз переглядають цей варіант"
                >
                  {viewersCount} дивл.
                </span>
              ) : (
                <span className="text-white/80 text-xs leading-none" aria-hidden="true">
                  ✦
                </span>
              )}
            </div>

            {/* Покращений природний та яскравий малюнок у кружечку */}
            <div
              className="w-[82px] h-[82px] xl:w-[92px] xl:h-[92px] rounded-full border-[3px] border-[#10163a] bg-white p-0.5 flex items-center justify-center my-1 transition-transform duration-200 group-hover:scale-105"
              style={{
                boxShadow: '0 4px 0 rgba(16, 22, 58, 0.45)',
              }}
            >
              <BatteryIllustration category={cat.key} />
            </div>

            {/* Компактний заголовок картки */}
            <div
              className="text-white font-black uppercase text-[0.78rem] xl:text-[0.84rem] leading-[1.2] px-1 my-2 min-h-[46px] flex items-center justify-center"
              style={{ textShadow: '0 2px 0 #10163a' }}
            >
              {cat.label}
            </div>

            {/* Кнопка ОБРАТИ */}
            <div
              aria-hidden="true"
              className="w-full py-1.5 px-3 rounded-xl border-[3px] border-[#10163a] font-display text-xs xl:text-sm font-black uppercase tracking-wide flex items-center justify-center gap-1.5 bg-gradient-to-b from-[#fff59d] to-[#fde047] text-[#10163a] transition-transform duration-100"
              style={{
                boxShadow: isPulsed ? '0 1px 0 #10163a' : '0 4px 0 #10163a',
              }}
            >
              <span>Обрати</span>
            </div>
          </div>
        );
      })}
    </section>
  );
};
