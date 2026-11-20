import { Archive, Building2, Calendar, FileText } from "lucide-react";
import type { DocumentoArchivioOut } from "../types/api";

export interface ArchiveDocumentCardProps {
  documento: DocumentoArchivioOut;
}

export function ArchiveDocumentCard({ documento }: ArchiveDocumentCardProps) {
  return (
    <section
      aria-label="Documento d'archivio collegato"
      className="museum-glass rounded-2xl border border-[#c9a86a]/45 p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#e4cc9a]">
          <Archive className="w-4 h-4 shrink-0" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">
            Fonte d&apos;Archivio Verificata
          </h3>
        </div>
        <span className="rounded-full bg-[#c9a86a]/20 border border-[#c9a86a]/50 px-2.5 py-0.5 text-[11px] font-mono text-[#e4cc9a]">
          {documento.segnatura}
        </span>
      </div>

      <div>
        <h4 className="font-serif-display text-xl font-medium text-white leading-snug">
          {documento.titolo}
        </h4>
        <p className="text-xs text-neutral-300 mt-0.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#c9a86a] shrink-0" aria-hidden="true" />
          <span>{documento.fondo}</span>
        </p>
      </div>

      <blockquote className="border-l-2 border-[#c9a86a]/70 pl-3.5 py-1 font-serif-display italic text-base text-neutral-100 leading-relaxed">
        &ldquo;{documento.estratto_verificato}&rdquo;
      </blockquote>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-neutral-300 border-t border-white/10">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
          <span>{documento.datazione}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#c9a86a]" aria-hidden="true" />
          <span>{documento.ente_conservazione}</span>
        </span>
      </div>
    </section>
  );
}
