import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { CorrelazioneItemOut, OperaDetailOut } from "../../types/api";
import { CATEGORIA_LABELS } from "../../utils/format";

interface ConnectionsGraphProps {
  sourceOpera: OperaDetailOut;
  connections: CorrelazioneItemOut[];
}

function truncateText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Splits a title cleanly across up to 2 balanced SVG lines so text never overflows its box */
function wrapTwoLines(text: string, maxPerLine = 22): [string, string | null] {
  if (text.length <= maxPerLine) return [text, null];
  const words = text.split(" ");
  let line1 = "";
  let line2 = "";
  for (const word of words) {
    if (!line1) {
      line1 = word;
    } else if ((line1 + " " + word).length <= maxPerLine) {
      line1 += " " + word;
    } else {
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
  const [selectedId, setSelectedId] = useState<number | null>(
    connections[0]?.opera.id ?? null,
  );

  if (connections.length === 0) {
    return (
      <p className="text-xl text-ink-secondary">
        Non risultano al momento opere, documenti o monumenti collegati a questo
        bene culturale.
      </p>
    );
  }

  const count = connections.length;
  // Wide viewBox (1140 x 460) with guaranteed clear horizontal & vertical separation
  const centerX = 570;
  const centerY = 66;
  const targetY = 382;

  // Target centers spaced 385px apart vs 310px box width => 75px guaranteed horizontal gap!
  const nodeXs =
    count === 1 ? [570] : count === 2 ? [300, 840] : [185, 570, 955];

  // Staggered label tiers guarantee ZERO overlap between relationship badges
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
      {/* Interactive Visual Schema / Graph — Mathematically Zero-Overlap Layout */}
      <div className="w-full overflow-x-auto pb-2">
        <svg
          viewBox="0 0 1140 460"
          role="img"
          aria-label={`Schema visivo delle connessioni storico-culturali di ${sourceOpera.titolo}`}
          className="h-auto min-w-[740px] w-full"
        >
          {/* Curved dashed golden connector paths + staggered relationship badges */}
          {connections.map((corr, idx) => {
            const tx = nodeXs[idx];
            const lp = labelPositions[idx];
            const isHighlighted = selectedId === corr.opera.id;

            // Smooth curve passing through the staggered label coordinate
            const startY = centerY + 46;
            const endY = targetY - 48;
            const ctrlX = tx === centerX ? centerX : (centerX + tx * 1.15) / 2.15;
            const ctrlY = lp.y;

            return (
              <g key={`edge-${corr.opera.id}`}>
                <path
                  d={`M ${centerX} ${startY} Q ${ctrlX} ${ctrlY} ${tx} ${endY}`}
                  fill="none"
                  stroke={isHighlighted ? "#856527" : "#C7AD77"}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeDasharray="7 6"
                  className="transition-all duration-300"
                />
                <circle
                  cx={tx}
                  cy={endY}
                  r={isHighlighted ? 5.5 : 4}
                  fill={isHighlighted ? "#856527" : "#A8843E"}
                />

                {/* Relationship label pill placed on dedicated non-overlapping tier */}
                <g transform={`translate(${lp.x}, ${lp.y})`}>
                  <rect
                    x={-130}
                    y={-18}
                    width={260}
                    height={36}
                    rx={18}
                    fill="#FAF6EE"
                    stroke={isHighlighted ? "#856527" : "#D9C396"}
                    strokeWidth={1.6}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#856527"
                    fontSize="13.5"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                  >
                    {truncateText(corr.tipo_relazione, 28)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Central Source Opera Node */}
          <g transform={`translate(${centerX}, ${centerY})`}>
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

          {/* Correlated Target Nodes with Clean 2-Line Wrapping */}
          {connections.map((corr, idx) => {
            const tx = nodeXs[idx];
            const isHighlighted = selectedId === corr.opera.id;
            const [line1, line2] = wrapTwoLines(corr.opera.titolo, 24);

            return (
              <g
                key={`node-${corr.opera.id}`}
                transform={`translate(${tx}, ${targetY})`}
                onMouseEnter={() => setSelectedId(corr.opera.id)}
                onClick={() => setSelectedId(corr.opera.id)}
                className="cursor-pointer"
              >
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
        {connections.map((corr) => {
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
                  {corr.tipo_relazione} · {CATEGORIA_LABELS[corr.opera.categoria]}
                </p>

                <h3 className="font-serif text-3xl font-semibold text-ink">
                  {corr.opera.titolo}
                </h3>

                <p className="text-base font-medium text-ink-muted">
                  {corr.opera.autore} · {corr.opera.anno} — {corr.opera.ente_nome}
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
