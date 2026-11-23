import React from 'react';
import type { VoteCategory } from '../types/battery';

interface IllustrationProps {
  category: VoteCategory;
}

export const BatteryIllustration: React.FC<IllustrationProps> = ({ category }) => {
  switch (category) {
    case 'support':
      return <SproutIllustration />;
    case 'direction':
      return <CompassIllustration />;
    case 'ideas':
      return <LightbulbIllustration />;
    case 'transform':
      return <ButterflyIllustration />;
  }
};

const SproutIllustration: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
    <defs>
      <clipPath id="clip-sprout">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      <linearGradient id="sky-sprout" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="65%" stopColor="#ecfccb" />
        <stop offset="100%" stopColor="#fef9c3" />
      </linearGradient>
      <radialGradient id="sun-sprout" cx="0.78" cy="0.22" r="0.35">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
        <stop offset="60%" stopColor="#fef08a" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="soil-sprout" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="55%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="leaf-left-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d9f99d" />
        <stop offset="45%" stopColor="#84cc16" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient id="leaf-right-grad" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="45%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
      <linearGradient id="stem-sprout" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="55%" stopColor="#16a34a" />
        <stop offset="100%" stopColor="#14532d" />
      </linearGradient>
    </defs>

    <g clipPath="url(#clip-sprout)">
      {/* Сонячне небо */}
      <rect x="0" y="0" width="100" height="100" fill="url(#sky-sprout)" />
      <rect x="0" y="0" width="100" height="100" fill="url(#sun-sprout)" />
      <circle cx="78" cy="22" r="9" fill="#fde047" opacity="0.85" />

      {/* Пологий пагорб землі */}
      <path
        d="M0 77 C22 69, 44 68, 66 72 C80 74, 92 75, 100 77 L100 100 L0 100 Z"
        fill="url(#soil-sprout)"
        stroke="#10163a"
        strokeWidth="2.5"
      />
      {/* Мох і травинки */}
      <path
        d="M12 76 Q17 70 28 72 Q35 67 45 71 Q60 68 74 73 Q86 71 94 76"
        fill="none"
        stroke="#4ade80"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path d="M22 74 Q19 64 14 61" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M26 73 Q28 65 31 62" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M76 74 Q80 65 85 63" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Природне зігнуте стебло */}
      <path
        d="M50 76 C50 64, 47 52, 50 38"
        fill="none"
        stroke="#10163a"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <path
        d="M50 76 C50 64, 47 52, 50 38"
        fill="none"
        stroke="url(#stem-sprout)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />

      {/* Лівий великий листок */}
      <path
        d="M49 52 C34 52, 20 42, 18 26 C33 25, 45 34, 49 52 Z"
        fill="url(#leaf-left-grad)"
        stroke="#10163a"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Прожилки лівого листка */}
      <path
        d="M47 50 C37 44, 29 37, 23 30"
        stroke="#14532d"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path d="M37 43 L34 36" stroke="#14532d" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <path d="M31 38 L37 34" stroke="#14532d" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />

      {/* Свіжий правий листок */}
      <path
        d="M49 54 C54 38, 69 30, 83 32 C80 47, 66 56, 49 54 Z"
        fill="url(#leaf-right-grad)"
        stroke="#10163a"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Прожилки правого листка */}
      <path
        d="M51 52 C61 46, 69 40, 77 35"
        stroke="#14532d"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path d="M62 46 L63 39" stroke="#14532d" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <path d="M68 42 L74 44" stroke="#14532d" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />

      {/* Молодий верхній паросток */}
      <path
        d="M50 40 C48 31, 52 22, 57 19 C59 27, 56 35, 50 40 Z"
        fill="#bef264"
        stroke="#10163a"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      {/* Краплинка роси на листку */}
      <ellipse cx="30" cy="31" rx="3" ry="2.2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
      <circle cx="29" cy="30.3" r="0.9" fill="#ffffff" />
    </g>
  </svg>
);

const CompassIllustration: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
    <defs>
      <clipPath id="clip-compass">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      <linearGradient id="sky-compass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="55%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#fef3c7" />
      </linearGradient>
      <linearGradient id="brass-bezel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="85%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <radialGradient id="dial-compass" cx="0.45" cy="0.4" r="0.6">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#fef9c3" />
        <stop offset="100%" stopColor="#fde68a" />
      </radialGradient>
    </defs>

    <g clipPath="url(#clip-compass)">
      {/* Яскравий фон */}
      <rect x="0" y="0" width="100" height="100" fill="url(#sky-compass)" />
      <circle cx="24" cy="22" r="14" fill="#ffffff" opacity="0.35" />

      {/* Кільце підвісу зверху */}
      <circle cx="50" cy="14" r="6.5" fill="none" stroke="#10163a" strokeWidth="4.5" />
      <circle cx="50" cy="14" r="6.5" fill="none" stroke="#fbbf24" strokeWidth="2.3" />
      <rect x="45" y="17" width="10" height="6" rx="2" fill="url(#brass-bezel)" stroke="#10163a" strokeWidth="2" />

      {/* Корпус латунного компаса */}
      <circle cx="50" cy="54" r="33" fill="url(#brass-bezel)" stroke="#10163a" strokeWidth="3" />
      <circle cx="50" cy="54" r="27" fill="url(#dial-compass)" stroke="#10163a" strokeWidth="2.2" />

      {/* Тонка шкала градусів */}
      <circle
        cx="50"
        cy="54"
        r="24"
        fill="none"
        stroke="#92400e"
        strokeWidth="1.2"
        strokeDasharray="2 3.2"
        opacity="0.65"
      />

      {/* Роза вітрів на тлі */}
      <polygon points="50,35 53,51 50,54 47,51" fill="#bae6fd" />
      <polygon points="50,73 53,57 50,54 47,57" fill="#bae6fd" />
      <polygon points="31,54 47,51 50,54 47,57" fill="#bae6fd" />
      <polygon points="69,54 53,51 50,54 53,57" fill="#bae6fd" />

      {/* Кардинальні напрями */}
      <text x="50" y="34.5" textAnchor="middle" fontSize="7" fontWeight="900" fill="#dc2626">
        Пн
      </text>
      <text x="50" y="77.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#334155">
        Пд
      </text>
      <text x="27" y="56.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#334155">
        Зх
      </text>
      <text x="73" y="56.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#334155">
        Сх
      </text>

      {/* Стрілка компаса під кутом */}
      <g transform="rotate(28 50 54)">
        {/* Червона північна стрілка (2 грані для об'єму) */}
        <polygon points="50,32 55.5,54 50,54" fill="#ef4444" stroke="#10163a" strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points="50,32 44.5,54 50,54" fill="#b91c1c" stroke="#10163a" strokeWidth="1.6" strokeLinejoin="round" />
        {/* Срібляста південна стрілка */}
        <polygon points="50,76 55.5,54 50,54" fill="#f1f5f9" stroke="#10163a" strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points="50,76 44.5,54 50,54" fill="#94a3b8" stroke="#10163a" strokeWidth="1.6" strokeLinejoin="round" />
      </g>

      {/* Центральна вісь */}
      <circle cx="50" cy="54" r="4.5" fill="#fbbf24" stroke="#10163a" strokeWidth="2" />
      <circle cx="49" cy="53" r="1.3" fill="#ffffff" />

      {/* Блік скла */}
      <path
        d="M30 45 A23 23 0 0 1 65 36"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.6"
      />
    </g>
  </svg>
);

const LightbulbIllustration: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
    <defs>
      <clipPath id="clip-bulb">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      <radialGradient id="bg-bulb" cx="0.5" cy="0.42" r="0.6">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </radialGradient>
      <radialGradient id="glass-bulb" cx="0.45" cy="0.38" r="0.55">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#fef08a" />
        <stop offset="75%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#ea580c" />
      </radialGradient>
      <linearGradient id="cap-bulb" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>

    <g clipPath="url(#clip-bulb)">
      {/* Глибокий контрастний фон із теплим сяйвом */}
      <rect x="0" y="0" width="100" height="100" fill="url(#bg-bulb)" />

      {/* Сонячні промені навколо лампи */}
      <g stroke="#fde047" strokeWidth="3.2" strokeLinecap="round" opacity="0.95">
        <line x1="50" y1="8" x2="50" y2="15" />
        <line x1="22" y1="18" x2="27" y2="23" />
        <line x1="78" y1="18" x2="73" y2="23" />
        <line x1="13" y1="42" x2="20" y2="42" />
        <line x1="87" y1="42" x2="80" y2="42" />
        <line x1="21" y1="64" x2="26" y2="59" />
        <line x1="79" y1="64" x2="74" y2="59" />
      </g>

      {/* Грушоподібна скляна колба */}
      <path
        d="M36 65 C35 58, 25 51, 25 38 C25 24, 36 16, 50 16 C64 16, 75 24, 75 38 C75 51, 65 58, 64 65 Z"
        fill="url(#glass-bulb)"
        stroke="#10163a"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Спіраль розжарювання та тримачі */}
      <path d="M43 64 L41 44 M57 64 L59 44" stroke="#9a3412" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M41 44 C43 37, 45 37, 47 44 C49 37, 51 37, 53 44 C55 37, 57 37, 59 44"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M41 44 C43 37, 45 37, 47 44 C49 37, 51 37, 53 44 C55 37, 57 37, 59 44"
        fill="none"
        stroke="#f97316"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Скляний блік на колбі */}
      <path
        d="M33 34 C34 26, 40 21, 46 21"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="32" cy="40" r="1.8" fill="#ffffff" opacity="0.85" />

      {/* Різьбовий цоколь */}
      <rect x="37" y="65" width="26" height="6" rx="2.5" fill="url(#cap-bulb)" stroke="#10163a" strokeWidth="2.5" />
      <rect x="38" y="71" width="24" height="5.5" rx="2.5" fill="url(#cap-bulb)" stroke="#10163a" strokeWidth="2.5" />
      <rect x="40" y="76.5" width="20" height="5" rx="2.5" fill="url(#cap-bulb)" stroke="#10163a" strokeWidth="2.5" />
      {/* Контакт цоколя */}
      <path d="M44 81.5 L56 81.5 L53 86.5 L47 86.5 Z" fill="#334155" stroke="#10163a" strokeWidth="2.2" strokeLinejoin="round" />
    </g>
  </svg>
);

const ButterflyIllustration: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
    <defs>
      <clipPath id="clip-butterfly">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      <linearGradient id="sky-butterfly" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="50%" stopColor="#fce7f3" />
        <stop offset="100%" stopColor="#fef9c3" />
      </linearGradient>
      <linearGradient id="wing-upper-l" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff4d6d" />
        <stop offset="45%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#fde047" />
      </linearGradient>
      <linearGradient id="wing-upper-r" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff4d6d" />
        <stop offset="45%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#fde047" />
      </linearGradient>
      <linearGradient id="wing-lower" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="65%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>

    <g clipPath="url(#clip-butterfly)">
      {/* Ніжне весняне небо */}
      <rect x="0" y="0" width="100" height="100" fill="url(#sky-butterfly)" />
      {/* М'які частинки пилку */}
      <circle cx="20" cy="24" r="2.2" fill="#f472b6" opacity="0.45" />
      <circle cx="82" cy="26" r="2.6" fill="#38bdf8" opacity="0.45" />
      <circle cx="78" cy="78" r="2" fill="#f59e0b" opacity="0.5" />
      <circle cx="24" cy="76" r="2.4" fill="#a855f7" opacity="0.4" />

      <g transform="rotate(-7 50 52)">
        {/* Нижні крила */}
        <path
          d="M47 54 C33 56, 21 67, 25 78 C29 86, 43 81, 48 63 Z"
          fill="url(#wing-lower)"
          stroke="#10163a"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M53 54 C67 56, 79 67, 75 78 C71 86, 57 81, 52 63 Z"
          fill="url(#wing-lower)"
          stroke="#10163a"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* Верхні розкішні крила */}
        <path
          d="M47 48 C34 23, 12 20, 14 40 C16 53, 31 58, 47 54 Z"
          fill="url(#wing-upper-l)"
          stroke="#10163a"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M53 48 C66 23, 88 20, 86 40 C84 53, 69 58, 53 54 Z"
          fill="url(#wing-upper-r)"
          stroke="#10163a"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />

        {/* Природні прожилки на крилах */}
        <path d="M44 48 L22 33 M44 51 L21 44 M45 58 L30 73" stroke="#1e1b4b" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        <path d="M56 48 L78 33 M56 51 L79 44 M55 58 L70 73" stroke="#1e1b4b" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />

        {/* Перлинні та бірюзові візерунки на краях крил */}
        <circle cx="21" cy="34" r="3.2" fill="#ffffff" stroke="#10163a" strokeWidth="1.2" />
        <circle cx="20" cy="43" r="2.2" fill="#38bdf8" stroke="#10163a" strokeWidth="1.1" />
        <circle cx="79" cy="34" r="3.2" fill="#ffffff" stroke="#10163a" strokeWidth="1.2" />
        <circle cx="80" cy="43" r="2.2" fill="#38bdf8" stroke="#10163a" strokeWidth="1.1" />
        <circle cx="31" cy="74" r="2.4" fill="#fef08a" stroke="#10163a" strokeWidth="1.1" />
        <circle cx="69" cy="74" r="2.4" fill="#fef08a" stroke="#10163a" strokeWidth="1.1" />

        {/* Вусики */}
        <path d="M48 33 C45 23, 39 19, 35 21" fill="none" stroke="#10163a" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="34.5" cy="21.5" r="2.1" fill="#fbbf24" stroke="#10163a" strokeWidth="1.2" />
        <path d="M52 33 C55 23, 61 19, 65 21" fill="none" stroke="#10163a" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="65.5" cy="21.5" r="2.1" fill="#fbbf24" stroke="#10163a" strokeWidth="1.2" />

        {/* Тіло та голівка метелика */}
        <ellipse cx="50" cy="54" rx="4.2" ry="17" fill="#1e1b4b" stroke="#10163a" strokeWidth="2" />
        <ellipse cx="50" cy="52" rx="1.8" ry="10" fill="#f59e0b" opacity="0.65" />
        <circle cx="50" cy="35" r="4.5" fill="#1e1b4b" stroke="#10163a" strokeWidth="2" />
        <circle cx="48.5" cy="34" r="1.1" fill="#ffffff" />
        <circle cx="51.5" cy="34" r="1.1" fill="#ffffff" />
      </g>
    </g>
  </svg>
);
