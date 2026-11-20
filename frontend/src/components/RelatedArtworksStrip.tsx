import { ArrowUpRight, Compass } from "lucide-react";
import type { CorrelazioneItemOut, OperaSummaryOut } from "../types/api";
import { formatRelationType } from "../utils/labels";

export interface RelatedArtworksStripProps {
  correlazioni: CorrelazioneItemOut[];
  onSelectOpera: (opera: OperaSummaryOut) => void;
}

export function RelatedArtworksStrip({
  correlazioni,
  onSelectOpera,
}: RelatedArtworksStripProps) {
  if (correlazioni.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        Nessuna correlazione territoriale disponibile al momento.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {correlazioni.map((item) => (
        <button
          key={item.opera.id}
          type="button"
          onClick={() => onSelectOpera(item.opera)}
          className="group text-left w-full museum-card hover:border-[#c9a86a]/65 rounded-xl p-3.5 transition-all flex items-start gap-3.5"
        >
          <img
            src={item.opera.immagine_url}
            alt={item.opera.titolo}
            className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0 bg-neutral-900"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[#e4cc9a]">
                <Compass className="w-3 h-3 shrink-0" aria-hidden="true" />
                {formatRelationType(item.tipo_relazione)}
              </span>
              <ArrowUpRight
                className="w-4 h-4 text-neutral-400 group-hover:text-[#e4cc9a] transition-colors shrink-0"
                aria-hidden="true"
              />
            </div>
            <p className="font-serif-display text-lg font-medium text-white group-hover:text-[#e4cc9a] transition-colors leading-snug mt-0.5 truncate">
              {item.opera.titolo}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">
              {item.opera.ente_nome} • {item.opera.anno}
            </p>
            <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
              {item.motivazione}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
