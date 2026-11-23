import React from 'react';
import { Check, Copy, Maximize2, Minimize2, RotateCcw, Star, Zap } from 'lucide-react';
import {
  CATEGORIES_LIST,
  calculateTeamCharge,
  getBatteryAppearance,
} from '../types/battery';
import type { VotesMap } from '../types/battery';

interface ResultsBoardProps {
  votes: VotesMap;
  copiedLink: boolean;
  isFullscreen: boolean;
  onCopyLink: () => void;
  onToggleFullscreen: () => void;
  onOpenReset: () => void;
}

export const ResultsBoard: React.FC<ResultsBoardProps> = ({
  votes,
  copiedLink,
  isFullscreen,
  onCopyLink,
  onToggleFullscreen,
  onOpenReset,
}) => {
  const { total, charge } = calculateTeamCharge(votes);
  const appearance = getBatteryAppearance(charge);

  return (
    <section
      aria-label="Командний результат та рівень заряду"
      className="rounded-[24px] border-[3.5px] border-[#38bdf8]/80 p-3.5 sm:p-4 flex flex-col justify-between gap-2.5"
      style={{
        background: 'linear-gradient(180deg, #173391 0%, #0e2063 100%)',
        boxShadow:
          '0 8px 0 #10163a, 0 16px 32px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.25)',
      }}
    >
      {/* Верхній заголовок правої панелі */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/15">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200/80">
            Панель підсумків
          </div>
          <h2
            className="font-display text-xl xl:text-2xl font-black uppercase text-[#ffca18] leading-tight"
            style={{ textShadow: '0 2px 0 #10163a' }}
          >
            Командний результат
          </h2>
        </div>
        <Star className="w-6 h-6 text-[#ffca18] fill-[#ffca18] shrink-0 drop-shadow-[0_2px_0_#10163a]" />
      </div>

      {/* Великий лічильник голосів */}
      <div className="bg-[#0b1544]/75 border-2 border-[#10163a] rounded-2xl px-3.5 py-2.5">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200/80">
          Відповіло педагогів
        </div>
        <div className="flex items-baseline gap-2.5 my-0.5">
          <span
            className="font-display font-mono-num text-3xl xl:text-4xl font-black text-[#ffca18] leading-none"
            style={{ textShadow: '0 3px 0 #10163a' }}
          >
            {total}
          </span>
          <span className="text-sm font-extrabold text-white">голосів</span>
        </div>
        <div className="text-[11px] font-bold text-sky-200/75">
          Підрахунок оновлюється автоматично
        </div>
      </div>

      {/* Розподіл відповідей */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200/85 px-0.5">
          Як розподілилися відповіді
        </div>

        {CATEGORIES_LIST.map((cat) => {
          const count = votes[cat.key];
          const percent = total === 0 ? 0 : Math.round((count / total) * 100);

          return (
            <div
              key={cat.key}
              className="bg-[#0b1544]/85 border-2 border-[#10163a] rounded-xl px-2.5 py-1.5"
            >
              <div className="flex justify-between items-center gap-2 mb-1 text-xs font-extrabold">
                <span className="flex items-center gap-2 text-white min-w-0">
                  <span
                    className="w-2.5 h-2.5 min-w-[10px] rounded-[3px] border border-[#10163a]"
                    style={{ backgroundColor: cat.dotColor }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{cat.shortLabel}</span>
                </span>
                <span className="font-mono-num font-black text-[#ffca18] whitespace-nowrap shrink-0">
                  {count} - {percent}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#060c29] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: cat.topColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Головна батарея заряду */}
      <div className="bg-[#0b1544]/85 border-2 border-[#10163a] rounded-2xl px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-white">
            <Zap className="w-4 h-4 text-[#ffca18] fill-[#ffca18]" />
            Загальний заряд змін
          </span>
          <span
            className="font-display font-mono-num text-xl font-black text-[#ffca18]"
            style={{ textShadow: '0 2px 0 #10163a' }}
          >
            {charge}%
          </span>
        </div>

        <div className="flex items-center mb-1.5">
          <div
            className="w-full h-7 border-[3px] border-[#10163a] rounded-lg p-[2px] relative bg-[#060c29] overflow-hidden"
            style={{ boxShadow: `0 0 16px ${appearance.glow}` }}
          >
            <div
              className="h-full rounded-[4px] relative overflow-hidden battery-sweep transition-[width,background] duration-500 ease-out"
              style={{
                width: `${charge}%`,
                background: `linear-gradient(90deg, ${appearance.color} 0%, ${appearance.color2} 100%)`,
              }}
            />
          </div>
          <div
            className="w-2 h-4 bg-slate-300 border-2 border-l-0 border-[#10163a] rounded-r"
            aria-hidden="true"
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-sky-100/90">
          <span className="truncate">{appearance.comment}</span>
          <span className="font-mono-num text-sky-200/75 whitespace-nowrap shrink-0">
            {charge} із 100
          </span>
        </div>
      </div>

      {/* Кнопки керування та примітка */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onOpenReset}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-[#ffe066] to-[#f59e0b] text-[#10163a] border-[3px] border-[#10163a] rounded-xl py-2 px-4 font-display text-sm font-black uppercase tracking-wide cursor-pointer hover:brightness-105 active:translate-y-0.5 transition-all"
          style={{
            boxShadow: '0 4px 0 #10163a, inset 0 2px 0 rgba(255, 255, 255, 0.65)',
          }}
        >
          <RotateCcw className="w-4 h-4 stroke-[2.6]" />
          <span>Перезапустити голосування</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex items-center justify-center gap-1.5 bg-[#122469] hover:bg-[#1a3185] text-sky-100 border-2 border-[#10163a] rounded-xl py-1.5 px-2.5 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Скопійовано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-300" />
                <span>Посилання</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            title="Повноекранний режим (клавіша F)"
            className="inline-flex items-center justify-center gap-1.5 bg-[#122469] hover:bg-[#1a3185] text-sky-100 border-2 border-[#10163a] rounded-xl py-1.5 px-2.5 text-xs font-extrabold cursor-pointer transition-colors whitespace-nowrap"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Згорнути</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span>На весь екран</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] font-semibold text-sky-200/75 text-center leading-snug">
          Заряд — орієнтовний індекс самооцінювання за шкалою 0 / 33 / 67 / 100. Це орієнтир для команди, а не оцінка компетентності.
        </p>
      </div>
    </section>
  );
};
