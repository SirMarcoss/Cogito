# Ispirazione Strutturale e UI/UX — Museo Palazzo Aurelia 3D

Il file [`museo_palazzo_aurelia_galleria_virtuale_3d.html`](./museo_palazzo_aurelia_galleria_virtuale_3d.html) è il prototipo di riferimento da cui prendere ispirazione per l'architettura visiva, l'organizzazione dell'interfaccia e l'esperienza esplorativa della web-app **Cogito ("Beyond the Museum")**.

## Elementi Chiave Rilevati nel Prototipo HTML
1. **Stack & Rendering 3D (`Three.js` 0.160.0)**
   - Canvas WebGL fullscreen con `ACESFilmicToneMapping`, `PCFSoftShadowMap`, environment map procedurale (`PMREMGenerator`) e texture PBR procedurali (marmi, parquet, intonaci, tele).
   - Navigazione guidata lungo un percorso `CatmullRomCurve3` con smorzamento inerziale, micro-parallasse e raycasting interattivo sulle opere.
2. **Design System Editoriale Museale**
   - Palette scura ad alto contrasto (`#0b0b0c`), pannelli in glassmorphism (`museum-glass`), accenti oro (`#c9a86a`, `#e4cc9a`).
   - Coppia tipografica: `Cormorant Garamond` per titoli e testi editoriali, `Inter` per HUD, metadati e controlli.
3. **Architettura dell'Interfaccia (HUD + Pannello Laterale)**
   - **Header HUD superiore**: identità museo/polo, indicatore sala/contesto dinamico, toggle acustica (Web Audio API) e accesso rapido alla mappa/planimetria.
   - **Rail laterale di progressione**: navigazione rapida tra sezioni/sale.
   - **Pillola contestuale in basso**: segnala l'opera più vicina con CTA immediata (*"Analizza l'opera"*).
   - **Pannello laterale di ispezione (`#inspection-panel`)**: scheda tecnica compatta, pulsanti per *punti focali* con zoom guidato sui dettagli dell'opera e schede di lettura tab-based (*Storia e Contesto*, *Tecnica*, *Simbologia*).
   - **Modale planimetria / mappa**: vista d'insieme delle sale/poli per saltare direttamente ai diversi ambienti.

## Adattamento Previsto per Cogito (React + Vite + TypeScript)
- Collegare la vista 3D / scheda ispezione ai dati reali del backend FastAPI (`/api/v1/opere/{id}`, `/qr/{code}`, `/narration`, `/related`, `/ask`).
- Affiancare al percorso 3D indoor la **mappa territoriale Leaflet/OSM** per la connessione *Beyond the Museum* tra musei, archivi e siti sul territorio.
- Integrare nel pannello laterale di ispezione il selettore di livello (`cogito_user_level`), il box archivio (`DocumentoArchivioOut`) e il player vocale basato su Web Speech API (`script_audio`).
