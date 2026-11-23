import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pointer, Sparkles } from 'lucide-react';
import { ActivityMonitor } from './components/ActivityMonitor';
import { BatteryCards } from './components/BatteryCards';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { ResultsBoard } from './components/ResultsBoard';
import { useBatterySocket } from './hooks/useBatterySocket';
import type { VoteCategory } from './types/battery';

function getRoomFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('room');
    if (raw && /^[a-zA-Z0-9_-]{1,32}$/.test(raw.trim())) {
      return raw.trim();
    }
  } catch {
    // ignore
  }
  return 'main';
}

export default function App() {
  const roomId = useMemo(() => getRoomFromUrl(), []);
  const [toastText, setToastText] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string) => {
    setToastText(text);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
    }, 1800);
  }, []);

  const {
    connectionState,
    votes,
    presence,
    activities,
    timeline,
    lastActiveVote,
    castVote,
    setFocusedCategory,
    resetSession,
  } = useBatterySocket({
    roomId,
    onVoteConfirmed: () => {
      showToast('Голос враховано!');
    },
  });

  const handleVote = useCallback(
    (category: VoteCategory) => {
      castVote(category);
    },
    [castVote]
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isResetModalOpen) return;

      const keyMap: Record<string, VoteCategory> = {
        '1': 'support',
        '2': 'direction',
        '3': 'ideas',
        '4': 'transform',
      };

      const chosen = keyMap[event.key];
      if (chosen) {
        handleVote(chosen);
        return;
      }

      const lower = event.key.toLowerCase();
      if (lower === 'f' || lower === 'а') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleVote, isResetModalOpen, toggleFullscreen]);

  const handleCopyLink = async () => {
    try {
      const shareUrl = new URL(window.location.href);
      const isDevPreview = shareUrl.hostname.startsWith('ais-dev-');
      if (isDevPreview) {
        shareUrl.hostname = shareUrl.hostname.replace(/^ais-dev-/, 'ais-pre-');
      }
      await navigator.clipboard.writeText(shareUrl.toString());
      setCopiedLink(true);
      showToast(
        isDevPreview
          ? 'Скопійовано публічне посилання (активується після Share / Опублікувати)'
          : 'Посилання скопійовано!'
      );
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Скопіюйте адресу з адресного рядка');
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex items-center justify-center p-2.5 sm:p-4 lg:overflow-hidden">
      {/* Спливаюче сповіщення */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 rounded-full border-[3px] border-[#10163a] px-5 py-2 font-black text-sm sm:text-base text-white pointer-events-none transition-all duration-300 ${
          toastText ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, #2ed573 0%, #10ac84 100%)',
          boxShadow: '0 5px 0 #10163a, 0 10px 20px rgba(0, 0, 0, 0.45)',
          textShadow: '0 2px 0 #10163a',
        }}
      >
        <Check className="w-4 h-4 stroke-[3.5]" />
        <span>{toastText || 'Голос враховано!'}</span>
      </div>

      {/* Основна двопанельна сітка як на зразку */}
      <main className="max-w-[1440px] w-full grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5 items-stretch">
        {/* Ліва головна панель */}
        <section
          aria-label="Голосування за рівень готовності до змін"
          className="relative rounded-[24px] border-[3.5px] border-[#38bdf8]/80 p-3.5 sm:p-5 flex flex-col justify-between gap-3"
          style={{
            background:
              'linear-gradient(155deg, #2468e8 0%, #163ea8 55%, #0e246f 100%)',
            boxShadow:
              '0 8px 0 #10163a, 0 16px 32px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.25)',
          }}
        >
          {/* Декоративна іскорка у правому верхньому куті */}
          <div
            className="hidden sm:flex items-center gap-1.5 absolute top-3.5 right-4 text-[#ffca18]"
            aria-hidden="true"
          >
            <Sparkles className="w-4 h-4 fill-[#ffca18]" />
          </div>

          {/* Заголовок усередині лівої панелі */}
          <header className="text-center flex flex-col items-center">
            <span
              className="inline-block bg-[#0b1544] border-2 border-[#38bdf8]/60 rounded-full px-3.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-sky-100 mb-1.5"
              style={{ boxShadow: '0 2px 0 #10163a' }}
            >
              Педагогічна рефлексія · Анонімно
            </span>

            <h1 className="font-display text-3xl sm:text-4xl xl:text-[2.75rem] font-black uppercase tracking-wider leading-none title-gold-gradient mb-1">
              БАТАРЕЯ ЗМІН
            </h1>

            <p
              className="text-sm sm:text-base font-black uppercase tracking-wide text-white mb-2"
              style={{ textShadow: '0 2px 0 #10163a' }}
            >
              Наскільки ми <span className="text-[#ffca18]">заряджені</span> до трансформацій?
            </p>

            <div
              className="inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-1 text-xs font-extrabold bg-[#0b1544] border-[#10163a] text-sky-100"
              style={{ boxShadow: '0 3px 0 #10163a' }}
            >
              <Pointer className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Обери відповідь. Кожне натискання = один анонімний голос.</span>
            </div>
          </header>

          {/* 4 картки-кнопки */}
          <BatteryCards
            presence={presence}
            lastActiveVote={lastActiveVote}
            onVote={handleVote}
            onFocusChange={setFocusedCategory}
          />

          {/* Нижня плашка: заклик + живий анонімний процес голосування */}
          <ActivityMonitor
            connectionState={connectionState}
            presence={presence}
            activities={activities}
            timeline={timeline}
          />
        </section>

        {/* Права панель підсумків */}
        <ResultsBoard
          votes={votes}
          copiedLink={copiedLink}
          isFullscreen={isFullscreen}
          onCopyLink={handleCopyLink}
          onToggleFullscreen={toggleFullscreen}
          onOpenReset={() => setIsResetModalOpen(true)}
        />
      </main>

      <ResetConfirmModal
        open={isResetModalOpen}
        onCancel={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          resetSession();
          setIsResetModalOpen(false);
          showToast('Новий раунд голосування розпочато!');
        }}
      />
    </div>
  );
}
