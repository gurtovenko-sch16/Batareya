import React, { useEffect } from 'react';

interface ResetConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#090d24]/80 backdrop-blur-sm flex items-center justify-center p-5 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="max-w-[460px] w-full rounded-[26px] border-4 border-[#10163a] p-7 text-center"
        style={{
          background: 'linear-gradient(180deg, #2185f7 0%, #1049a9 100%)',
          boxShadow: '0 10px 0 #10163a, 0 25px 50px rgba(0, 0, 0, 0.7)',
        }}
      >
        <h2
          id="modalTitle"
          className="font-display text-2xl font-black uppercase text-[#ffeaa7] mb-3"
          style={{ textShadow: '0 2px 0 #10163a' }}
        >
          Підтвердження дії
        </h2>
        <p className="bg-white text-[#10163a] border-[3px] border-[#10163a] rounded-2xl p-3.5 text-base font-extrabold leading-relaxed mb-5">
          Ви впевнені, що хочете очистити всі результати голосування для всієї команди? Цю дію неможливо скасувати.
        </p>
        <div className="flex gap-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-[14px] text-base font-black cursor-pointer border-[3px] border-[#10163a] bg-slate-200 text-[#10163a] active:translate-y-[3px] transition-transform"
            style={{ boxShadow: '0 5px 0 #10163a' }}
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-[14px] text-base font-black cursor-pointer border-[3px] border-[#10163a] bg-[#ff3b30] text-white active:translate-y-[3px] transition-transform"
            style={{
              textShadow: '0 2px 0 #10163a',
              boxShadow: '0 5px 0 #10163a',
            }}
          >
            Так, очистити
          </button>
        </div>
      </div>
    </div>
  );
};
