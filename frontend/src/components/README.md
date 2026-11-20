# Components Directory

Questa cartella ospiterà i componenti modulari della UI di **Cogito** (React + TypeScript), disaccoppiati dalla logica di fetching e ispirati all'estetica editoriale/museale di `docs/inspiration/museo_palazzo_aurelia_galleria_virtuale_3d.html`:

- `LevelSelectorSheet.tsx` — Bottom-sheet mobile-first per scegliere `cogito_user_level` (`bambino`, `ragazzo`, `adulto`, `esperto`)
- `ArchiveDocumentCard.tsx` — Box valorizzazione archivio (`segnatura`, `fondo`, `datazione`, `estratto_verificato`, `ente_conservazione`)
- `SpeechPlayerBar.tsx` — Player accessibile per sintesi vocale (`script_audio`) con stati play/pause/stop
- `RelatedArtworksStrip.tsx` — Card delle opere e dei documenti correlati sul territorio
- `Gallery3DExperience.tsx` — (Opzionale) Scena Three.js ispirata al percorso di Palazzo Aurelia
- `OperaSkeleton.tsx` — Skeleton loader eleganti per ridurre la latenza percepita durante le chiamate Gemini
