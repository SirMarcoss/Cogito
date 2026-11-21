interface AskAiIllustrationProps {
  className?: string;
}

/**
 * Animated SVG illustration matching the museum visitor style of QrScanIllustration:
 * a curious visitor ("omino") with three animated golden question marks hovering above.
 */
export function AskAiIllustration({
  className = "h-16 w-16 shrink-0",
}: AskAiIllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Subtle warm golden halo behind the three question marks */}
      <circle cx="60" cy="36" r="30" fill="#E5C882" opacity="0.22">
        <animate
          attributeName="opacity"
          values="0.16;0.34;0.16"
          dur="2.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values="28;32;28"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Left "?" floating & bobbing */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 1.5; 0 -5; 0 1.5"
          dur="2.4s"
          begin="0s"
          repeatCount="indefinite"
        />
        <text
          x="29"
          y="42"
          textAnchor="middle"
          fontFamily='"Cormorant Garamond", Georgia, serif'
          fontSize="24"
          fontWeight="700"
          fill="#856527"
        >
          ?
          <animate
            attributeName="fill"
            values="#856527;#D4A43E;#856527"
            dur="2.4s"
            begin="0s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.55;1;0.55"
            dur="2.4s"
            begin="0s"
            repeatCount="indefinite"
          />
        </text>
      </g>

      {/* Center taller "?" floating & bobbing */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 2; 0 -6; 0 2"
          dur="2.4s"
          begin="0.45s"
          repeatCount="indefinite"
        />
        <text
          x="60"
          y="31"
          textAnchor="middle"
          fontFamily='"Cormorant Garamond", Georgia, serif'
          fontSize="30"
          fontWeight="700"
          fill="#D4A43E"
        >
          ?
          <animate
            attributeName="fill"
            values="#856527;#D4A43E;#856527"
            dur="2.4s"
            begin="0.45s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.65;1;0.65"
            dur="2.4s"
            begin="0.45s"
            repeatCount="indefinite"
          />
        </text>
      </g>

      {/* Right "?" floating & bobbing */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 1.5; 0 -5; 0 1.5"
          dur="2.4s"
          begin="0.9s"
          repeatCount="indefinite"
        />
        <text
          x="91"
          y="42"
          textAnchor="middle"
          fontFamily='"Cormorant Garamond", Georgia, serif'
          fontSize="24"
          fontWeight="700"
          fill="#856527"
        >
          ?
          <animate
            attributeName="fill"
            values="#856527;#D4A43E;#856527"
            dur="2.4s"
            begin="0.9s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.55;1;0.55"
            dur="2.4s"
            begin="0.9s"
            repeatCount="indefinite"
          />
        </text>
      </g>

      {/* Subtle warm ground shadow */}
      <ellipse cx="60" cy="112" rx="28" ry="4.5" fill="#E6DAC2" />

      {/* Visitor ("Omino") shoulders & torso */}
      <path
        d="M36 109 C36 86 45 77 60 77 C75 77 84 86 84 109 Z"
        fill="#4A4035"
      />
      {/* Subtle gold collar lapel */}
      <path
        d="M52 78 L60 88 L68 78"
        stroke="#C49C4D"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Curious head with gentle tilt */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-2 60 62; 4 60 62; -2 60 62"
          dur="3.4s"
          repeatCount="indefinite"
        />
        <circle cx="60" cy="59" r="13.5" fill="#2A2118" />
        {/* Warm gold rim accent */}
        <circle
          cx="60"
          cy="59"
          r="13.5"
          stroke="#A8843E"
          strokeWidth="1.2"
          opacity="0.55"
        />
      </g>

      {/* Thoughtful arm raised toward chin */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 76 92; -6 76 92; 0 76 92"
          dur="3.4s"
          repeatCount="indefinite"
        />
        <path
          d="M78 96 L83 84 L69 73"
          stroke="#4A4035"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="68" cy="72" r="4.8" fill="#D9B795" />
      </g>
    </svg>
  );
}
