import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CorrelazioneItemOut, OperaDetailOut } from "../../types/api";
import { CATEGORIA_LABELS, formatRelationType } from "../../utils/format";

interface ConnectionsGraphProps {
  sourceOpera: OperaDetailOut;
  connections: CorrelazioneItemOut[];
}

function truncateText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function wrapTwoLines(text: string, maxPerLine = 22): [string, string | null] {
  if (text.length <= maxPerLine) return [text, null];
  const words = text.split(" ");
  let line1 = "";
  let line2 = "";
  let overflowed = false;
  for (const word of words) {
    if (!overflowed && !line1) {
      line1 = word;
    } else if (!overflowed && (line1 + " " + word).length <= maxPerLine) {
      line1 += " " + word;
    } else {
      overflowed = true;
      line2 = line2 ? `${line2} ${word}` : word;
    }
  }
  if (line2.length > maxPerLine) {
    line2 = truncateText(line2, maxPerLine);
  }
  return [truncateText(line1, maxPerLine), line2 || null];
}

export function ConnectionsGraph({
  sourceOpera,
  connections,
}: ConnectionsGraphProps) {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(
    connections[0]?.opera.id ?? null,
  );
  const [entered, setEntered] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset & trigger staged SVG entrance animation cleanly whenever source artwork changes or enters viewport
  useEffect(() => {
    setSelectedId(connections[0]?.opera.id ?? null);
    setEntered(false);

    const el = graphContainerRef.current;
    if (!el) return;

    const triggerIfInView = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= (window.innerHeight || 800) * 0.92 && rect.bottom >= 0) {
        setEntered(true);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1 },
    );

    const timer = window.setTimeout(() => {
      observer.observe(el);
      triggerIfInView();
    }, 100);

    window.addEventListener("scroll", triggerIfInView, { passive: true });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("scroll", triggerIfInView);
    };
  }, [sourceOpera.id, connections]);

  const visibleConnections = connections.slice(0, 3);

  if (visibleConnections.length === 0) {
    return (
      <p className="text-xl text-ink-secondary">
        Non risultano al momento opere, documenti o monumenti collegati a questo
        bene culturale.
      </p>
    );
  }

  const count = visibleConnections.length;
  const centerX = 570;
  const centerY = 66;
  const targetY = 382;

  const nodeXs =
    count === 1 ? [570] : count === 2 ? [300, 840] : [185, 570, 955];

  const labelPositions: Array<{ x: number; y: number }> =
    count === 1
      ? [{ x: 570, y: 222 }]
      : count === 2
        ? [
            { x: 350, y: 218 },
            { x: 790, y: 218 },
          ]
        : [
            { x: 245, y: 196 },
            { x: 570, y: 258 },
            { x: 895, y: 196 },
          ];

  const [srcLine1, srcLine2] = wrapTwoLines(sourceOpera.titolo, 34);

  return (
    <div className="space-y-8">
      {/* Interactive Visual Schema / Graph with Progressive Draw-In & Flowing Golden Pulse */}
      <div ref={graphContainerRef} className="w-full overflow-x-auto pb-2">
        <svg
          viewBox="0 0 1140 460"
          role="group"
          aria-label={`Schema visivo delle connessioni storico-culturali di ${sourceOpera.titolo}`}
          className="h-auto w-full min-w-[620px] lg:min-w-0"
        >
          {/* Curved connector paths + animated draw-in + flowing golden pulse along active path */}
          {visibleConnections.map((corr, idx) => {
            const tx = nodeXs[idx];
            const lp = labelPositions[idx];
            const isHighlighted = selectedId === corr.opera.id;

            const startY = centerY + 46;
            const endY = targetY - 48;
            const ctrlX =
              tx === centerX ? centerX : (centerX + tx * 1.15) / 2.15;
            const ctrlY = lp.y;
            const pathD = `M ${centerX} ${startY} Q ${ctrlX} ${ctrlY} ${tx} ${endY}`;

            return (
              <g key={`edge-${corr.opera.id}`}>
                {/* Progressive SVG stroke-draw underlay */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHighlighted ? "#856527" : "#C7AD77"}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeDasharray="700"
                  strokeDashoffset={entered ? 0 : 700}
                  style={{
                    transition: `stroke-dashoffset 850ms cubic-bezier(0.22, 1, 0.36, 1) ${180 + idx * 140}ms, stroke 260ms ease`,
                  }}
                />

                {/* Soft dashed overlay accent once drawn */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FAF6EE"
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  strokeDasharray="5 9"
                  style={{
                    opacity: entered ? 0.55 : 0,
                    transition: `opacity 500ms ease ${700 + idx * 120}ms`,
                  }}
                />

                {/* Flowing golden signal dot travelling smoothly along the selected relationship path */}
                {entered && isHighlighted && (
                  <circle r="5.5" fill="#D4A43E">
                    <animateMotion
                      dur="2.6s"
                      repeatCount="indefinite"
                      path={pathD}
                    />
                    <animate
                      attributeName="opacity"
                      values="0.25;1;1;0.25"
                      keyTimes="0;0.18;0.82;1"
                      dur="2.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                <circle
                  cx={tx}
                  cy={endY}
                  r={isHighlighted ? 6 : 4.2}
                  fill={isHighlighted ? "#856527" : "#A8843E"}
                  style={{
                    opacity: entered ? 1 : 0,
                    transition: `opacity 450ms ease ${520 + idx * 130}ms`,
                  }}
                />

                {/* Staggered relationship label badge */}
                <g
                  transform={`translate(${lp.x}, ${lp.y})`}
                  style={{
                    opacity: entered ? 1 : 0,
                    transition: `opacity 600ms ease ${380 + idx * 140}ms`,
                  }}
                >
                  <rect
                    x={-130}
                    y={-18}
                    width={260}
                    height={36}
                    rx={18}
                    fill="#FAF6EE"
                    stroke={isHighlighted ? "#856527" : "#D9C396"}
                    strokeWidth={isHighlighted ? 2 : 1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#856527"
                    fontSize="13.5"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                  >
                    {truncateText(formatRelationType(corr.tipo_relazione), 28)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Central Source Opera Node */}
          <g
            transform={`translate(${centerX}, ${centerY}) scale(${entered ? 1 : 0.92})`}
            style={{
              opacity: entered ? 1 : 0,
              transition:
                "opacity 650ms cubic-bezier(0.16, 1, 0.3, 1), transform 650ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <rect
              x={-230}
              y={-46}
              width={460}
              height={92}
              rx={28}
              fill="#856527"
            />
            <text
              y={srcLine2 ? -22 : -13}
              textAnchor="middle"
              fill="#F4EDE0"
              fontSize="12"
              fontWeight="600"
              letterSpacing="1.6"
              fontFamily="Inter, sans-serif"
            >
              {`OPERA CONSULTATA · ${CATEGORIA_LABELS[sourceOpera.categoria].toUpperCase()}`}
            </text>
            <text
              y={srcLine2 ? 4 : 15}
              textAnchor="middle"
              fill="#FFFDF8"
              fontSize="22"
              fontWeight="700"
              fontFamily='"Cormorant Garamond", Georgia, serif'
            >
              {srcLine1}
            </text>
            {srcLine2 && (
              <text
                y={28}
                textAnchor="middle"
                fill="#FFFDF8"
                fontSize="22"
                fontWeight="700"
                fontFamily='"Cormorant Garamond", Georgia, serif'
              >
                {srcLine2}
              </text>
            )}
          </g>

          {/* Correlated Target Nodes with Staggered Upward Reveal + Highlight Ring */}
          {visibleConnections.map((corr, idx) => {
            const tx = nodeXs[idx];
            const isHighlighted = selectedId === corr.opera.id;
            const [line1, line2] = wrapTwoLines(corr.opera.titolo, 24);
            const nodeOffsetY = entered ? targetY : targetY + 26;
            const relationLabel = formatRelationType(corr.tipo_relazione);

            return (
              <g
                key={`node-${corr.opera.id}`}
                role="button"
                tabIndex={0}
                aria-label={`Apri scheda di ${corr.opera.titolo} (${relationLabel})`}
                transform={`translate(${tx}, ${nodeOffsetY})`}
                onMouseEnter={() => setSelectedId(corr.opera.id)}
                onFocus={() => setSelectedId(corr.opera.id)}
                onClick={() => navigate(`/opera/${corr.opera.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/opera/${corr.opera.id}`);
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep"
                style={{
                  opacity: entered ? 1 : 0,
                  transition: `opacity 680ms cubic-bezier(0.16, 1, 0.3, 1) ${450 + idx * 150}ms, transform 680ms cubic-bezier(0.16, 1, 0.3, 1) ${450 + idx * 150}ms`,
                }}
              >
                {isHighlighted && (
                  <rect
                    x={-161}
                    y={-54}
                    width={322}
                    height={108}
                    rx={24}
                    fill="none"
                    stroke="#C8A050"
                    strokeWidth={1.5}
                    opacity={0.5}
                  />
                )}
                <rect
                  x={-155}
                  y={-48}
                  width={310}
                  height={96}
                  rx={20}
                  fill={isHighlighted ? "#F4EDE0" : "#FAF6EE"}
                  stroke={isHighlighted ? "#856527" : "#C7AD77"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                />
                <text
                  y={line2 ? -24 : -14}
                  textAnchor="middle"
                  fill="#856527"
                  fontSize="11.5"
                  fontWeight="600"
                  letterSpacing="1.3"
                  fontFamily="Inter, sans-serif"
                >
                  {CATEGORIA_LABELS[corr.opera.categoria].toUpperCase()} ·{" "}
                  {corr.opera.anno}
                </text>
                <text
                  y={line2 ? 3 : 14}
                  textAnchor="middle"
                  fill="#1E1812"
                  fontSize="20"
                  fontWeight="700"
                  fontFamily='"Cormorant Garamond", Georgia, serif'
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    y={27}
                    textAnchor="middle"
                    fill="#1E1812"
                    fontSize="20"
                    fontWeight="700"
                    fontFamily='"Cormorant Garamond", Georgia, serif'
                  >
                    {line2}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Clear Editorial Explanations & Direct Links for Each Connected Work */}
      <ul className="divide-y divide-gold-light/60">
        {visibleConnections.map((corr) => {
          const isHighlighted = selectedId === corr.opera.id;
          return (
            <li
              key={corr.opera.id}
              onMouseEnter={() => setSelectedId(corr.opera.id)}
              className={`flex flex-col gap-5 py-6 transition sm:flex-row sm:items-center sm:justify-between ${
                isHighlighted ? "border-l-4 border-l-gold-deep pl-5" : "pl-1"
              }`}
            >
              <div className="space-y-1.5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-deep">
                  {formatRelationType(corr.tipo_relazione)} ·{" "}
                  {CATEGORIA_LABELS[corr.opera.categoria]}
                </p>

                <h3 className="font-serif text-3xl font-semibold text-ink">
                  {corr.opera.titolo}
                </h3>

                <p className="text-base font-medium text-ink-muted">
                  {corr.opera.autore} · {corr.opera.anno} —{" "}
                  {corr.opera.ente_nome}
                </p>

                <p className="max-w-2xl text-lg leading-relaxed text-ink-secondary">
                  {corr.motivazione}
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  to={`/opera/${corr.opera.id}`}
                  className="btn-museum-secondary whitespace-nowrap"
                >
                  <span>Vai al bene collegato</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
