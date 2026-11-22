export function QrScanIllustration() {
  return (
    <figure
      aria-label="Illustrazione animata di un visitatore che inquadra il codice QR vicino a un'opera museale"
      className="group w-full max-w-[330px] shrink-0 select-none"
    >
      <svg
        viewBox="0 0 320 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
      >
        {/* Subtle warm museum floor shadow */}
        <ellipse cx="165" cy="202" rx="134" ry="10" fill="#E6DAC2" />

        {/* Framed Classical Artwork on Museum Wall (Right side) */}
        <rect
          x="194"
          y="22"
          width="102"
          height="122"
          rx="6"
          fill="#FAF6EE"
          stroke="#A8843E"
          strokeWidth="3.5"
        />
        <rect
          x="203"
          y="31"
          width="84"
          height="104"
          rx="3"
          fill="#EFE5D2"
          stroke="#D7C297"
          strokeWidth="1.5"
        />
        <path
          d="M215 120 L215 74 A30 30 0 0 1 275 74 L275 120 Z"
          fill="#E2D1AE"
        />
        <circle cx="245" cy="68" r="11" fill="#C49C4D" opacity="0.88" />
        <path
          d="M205 126 Q230 98 254 114 T285 112 L285 133 L205 133 Z"
          fill="#856527"
          opacity="0.72"
        />

        {/* Museum QR Code Plaque mounted next to the artwork */}
        <rect
          x="140"
          y="78"
          width="42"
          height="50"
          rx="6"
          fill="#FFFDF8"
          stroke="#856527"
          strokeWidth="2.2"
        />
        <rect x="148" y="86" width="10" height="10" rx="1.5" fill="#1E1812" />
        <rect x="164" y="86" width="10" height="10" rx="1.5" fill="#1E1812" />
        <rect x="148" y="102" width="10" height="10" rx="1.5" fill="#1E1812" />
        <rect x="150.5" y="88.5" width="5" height="5" fill="#FFFDF8" />
        <rect x="166.5" y="88.5" width="5" height="5" fill="#FFFDF8" />
        <rect x="150.5" y="104.5" width="5" height="5" fill="#FFFDF8" />
        <rect x="163" y="101" width="4" height="4" fill="#1E1812" />
        <rect x="169" y="101" width="5" height="5" fill="#1E1812" />
        <rect x="163" y="108" width="5" height="4" fill="#1E1812" />
        <rect x="170" y="108" width="4" height="4" fill="#856527" />
        <line
          x1="150"
          y1="120"
          x2="172"
          y2="120"
          stroke="#A8843E"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Native SVG SMIL Laser Scan Line sweeping smoothly over QR */}
        <line
          x1="143"
          y1="84"
          x2="179"
          y2="84"
          stroke="#D4A43E"
          strokeWidth="2.6"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 36; 0 0"
            dur="2.1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="2.1s"
            repeatCount="indefinite"
          />
        </line>

        {/* Glowing QR Framing Brackets */}
        <path
          d="M134 84 L134 73 L145 73 M177 73 L188 73 L188 84 M134 122 L134 133 L145 133 M177 133 L188 133 L188 122"
          stroke="#856527"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="stroke"
            values="#856527;#D4A43E;#856527"
            dur="2.1s"
            repeatCount="indefinite"
          />
        </path>

        {/* Visitor Body */}
        <circle cx="52" cy="54" r="15" fill="#2A2118" />
        <path
          d="M30 132 C30 96 36 78 54 78 C70 78 78 92 84 112 L74 138 L30 138 Z"
          fill="#4A4035"
        />
        <path
          d="M38 138 L36 196 M62 138 L66 196"
          stroke="#1E1812"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Animated Arm + Smartphone + Scanning Cone + Camera Flash */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="4 62 94; -11 62 94; -7 62 94; 4 62 94"
            keyTimes="0; 0.44; 0.72; 1"
            dur="3.2s"
            repeatCount="indefinite"
          />

          {/* Pulsing Golden Scan Beam Cone */}
          <path
            d="M106 94 L142 78 L142 128 L106 113 Z"
            fill="#C89B3C"
            opacity="0.22"
          >
            <animate
              attributeName="opacity"
              values="0.1;0.42;0.16;0.1"
              keyTimes="0;0.45;0.7;1"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </path>

          {/* Arm */}
          <path
            d="M62 94 L94 106"
            stroke="#4A4035"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="96" cy="107" r="6" fill="#D9B795" />

          {/* Smartphone */}
          <rect
            x="93"
            y="86"
            width="13"
            height="32"
            rx="3"
            fill="#1E1812"
            stroke="#A8843E"
            strokeWidth="1.8"
          />
          <line
            x1="103"
            y1="92"
            x2="103"
            y2="112"
            stroke="#E5C882"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Periodic Camera Flash Starburst & Expanding Halo */}
          <circle cx="109" cy="94" r="6" fill="#FFFCE6" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0;0.95;0;0"
              keyTimes="0;0.42;0.48;0.6;1"
              dur="3.2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="3;3;14;18;3"
              keyTimes="0;0.42;0.48;0.6;1"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </circle>
          <path
            d="M109 80 L111.5 91.5 L123 94 L111.5 96.5 L109 108 L106.5 96.5 L95 94 L106.5 91.5 Z"
            fill="#F6D16F"
            opacity="0"
          >
            <animate
              attributeName="opacity"
              values="0;0;1;0;0"
              keyTimes="0;0.42;0.48;0.58;1"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Museum velvet rope stanchion near artwork */}
        <line
          x1="196"
          y1="168"
          x2="196"
          y2="198"
          stroke="#A8843E"
          strokeWidth="3"
        />
        <circle cx="196" cy="166" r="4" fill="#856527" />
        <line
          x1="292"
          y1="168"
          x2="292"
          y2="198"
          stroke="#A8843E"
          strokeWidth="3"
        />
        <circle cx="292" cy="166" r="4" fill="#856527" />
        <path
          d="M196 172 Q244 186 292 172"
          stroke="#856527"
          strokeWidth="2.5"
          fill="none"
        />
      </svg>
    </figure>
  );
}
