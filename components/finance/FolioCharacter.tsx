"use client";
/** Original SVG character; mouth movement follows speech events, not simulated audio. */
export default function FolioCharacter({
  speaking,
  listening,
  thinking,
  paused = false,
}: {
  speaking: boolean;
  listening: boolean;
  thinking: boolean;
  paused?: boolean;
}) {
  const state = listening
    ? "listening"
    : speaking
      ? "speaking"
      : thinking
        ? "thinking"
        : paused ? "paused" : "ready";
  return (
    <div
      className={`folio-character ${state}`}
      role="img"
      aria-label={`Folio, your cartoon financial guide, ${state}`}
    >
      <svg viewBox="0 0 320 280" aria-hidden="true">
        <circle className="folio-halo" cx="160" cy="140" r="115" fill="none" stroke="currentColor" strokeWidth="3" />
        <g className="folio-listen-waves" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
          <path d="M65 102q-18 20 0 40M51 92q-27 30 0 60M252 102q18 20 0 40M266 92q27 30 0 60" />
        </g>
        <g className="folio-thought" fill="currentColor">
          <circle cx="237" cy="39" r="5" /><circle cx="255" cy="30" r="6" /><circle cx="276" cy="24" r="7" />
        </g>
        <g className="folio-voice-bars" fill="currentColor">
          {[0, 1, 2, 3, 4].map(n => <rect key={n} x={249 + n * 9} y={170} width="5" height={25} rx="2.5" style={{ animationDelay: `${n * 95}ms` }} />)}
        </g>
        <defs>
          <linearGradient id="folio-paper" x2=".8" y2="1">
            <stop stopColor="#fffef5" />
            <stop offset="1" stopColor="#d7ebe5" />
          </linearGradient>
          <linearGradient id="folio-jacket" x2="1" y2="1">
            <stop stopColor="#28675e" />
            <stop offset="1" stopColor="#173d49" />
          </linearGradient>
        </defs>
        <ellipse cx="160" cy="257" rx="80" ry="12" fill="#174f4720" />
        <g className="folio-body">
          <path
            d="M97 163Q73 160 61 184"
            fill="none"
            stroke="#28675e"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            className="folio-wave"
            d="M226 158Q251 153 259 119"
            fill="none"
            stroke="#28675e"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <circle cx="261" cy="113" r="13" fill="#f3d9b0" />
          <path
            d="M136 222v25M185 222v25"
            stroke="#193d48"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M89 54Q89 34 109 34H198L231 67V207Q231 227 211 227H109Q89 227 89 207Z"
            fill="url(#folio-paper)"
            stroke="#477e78"
            strokeWidth="3"
          />
          <path
            d="M198 34v23q0 11 12 11h21"
            fill="#b8d9d1"
            stroke="#477e78"
            strokeWidth="3"
          />
          <g className="folio-eyes">
            <circle
              cx="126"
              cy="106"
              r="20"
              fill="#fff"
              stroke="#1d4552"
              strokeWidth="5"
            />
            <circle
              cx="189"
              cy="106"
              r="20"
              fill="#fff"
              stroke="#1d4552"
              strokeWidth="5"
            />
            <path
              d="M147 105q11-8 21 0"
              fill="none"
              stroke="#1d4552"
              strokeWidth="5"
            />
            <ellipse cx="130" cy="107" rx="5" ry="8" fill="#173949" />
            <ellipse cx="185" cy="107" rx="5" ry="8" fill="#173949" />
            <circle cx="132" cy="104" r="2" fill="white" />
            <circle cx="187" cy="104" r="2" fill="white" />
          </g>
          <ellipse
            cx="109"
            cy="134"
            rx="10"
            ry="5"
            fill="#e8a8a1"
            opacity=".6"
          />
          <ellipse
            cx="208"
            cy="134"
            rx="10"
            ry="5"
            fill="#e8a8a1"
            opacity=".6"
          />
          <path
            className="folio-smile"
            d="M144 140q16 16 32 0"
            fill="none"
            stroke="#264957"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse
            className="folio-mouth"
            cx="160"
            cy="145"
            rx="12"
            ry="9"
            fill="#264957"
          />
          <path
            d="M89 169l49-12 22 24 22-24 49 12v38q0 20-20 20H109q-20 0-20-20Z"
            fill="url(#folio-jacket)"
          />
          <path
            d="M138 157l22 24-15 12-15-32M182 157l-22 24 15 12 15-32"
            fill="#75aba0"
          />
          <path d="M155 181h10l4 25-9 9-9-9Z" fill="#e2b968" />
          <rect x="190" y="184" width="25" height="14" rx="4" fill="#f5ead0" />
          <path d="M197 191h11" stroke="#437365" strokeWidth="2" />
        </g>
        <g className="folio-sparks" fill="#c4a05c">
          <path d="M59 68l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" />
          <circle cx="252" cy="64" r="5" />
          <circle cx="60" cy="218" r="4" />
        </g>
      </svg>
      <span className="folio-status">
        <i />
        {listening
          ? "Folio is listening"
          : speaking
            ? "Folio is speaking"
            : thinking
              ? "Folio is thinking"
              : paused ? "Microphone off" : "Ready when you are"}
      </span>
    </div>
  );
}
