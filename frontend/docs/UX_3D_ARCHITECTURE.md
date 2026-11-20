# COGITO ("Beyond the Museum") — Architettura UX, Flussi 2D/3D e Regole delle 4 Sale

Questo documento integra [`FRONTEND_CONTEXT.md`](./FRONTEND_CONTEXT.md) e definisce l'architettura funzionale e spaziale definitiva della web-app **Cogito**, ispirata allo stile visivo di [`museo_palazzo_aurelia_galleria_virtuale_3d.html`](./inspiration/museo_palazzo_aurelia_galleria_virtuale_3d.html) (sfondo `#0b0b0c`, accenti `#c9a86a` / `#e4cc9a`, pannelli `museum-glass`, font `Cormorant Garamond` + `Inter`).

---

## 1. Principio Architetturale: Hub 3D Fisso + Pagine 2D Veloci (Doppio Accesso)

L'applicazione adotta un modello ibrido per unire l'esperienza immersiva museale alla rapidità mobile-first sul campo:

1. **Accesso diretto da QR fisico (`/qr/:code`):**
   - Chi inquadra un QR code da smartphone in un museo o sul territorio atterra **immediatamente** sulla scheda opera **2D** leggera, veloce e accessibile (stile `museum-glass` nero/oro, zero attesa di caricamento WebGL).
   - Nella scheda 2D è sempre presente un'azione esplicita (es. *"Entra nella Sala 3D"*) per passare alla **Sala IV** immersiva se l'utente lo desidera.
2. **Accesso dall'Hub 3D principale:**
   - L'architettura 3D ha **4 stanze fisse e controllate** (non si generano edifici procedurali infiniti dal database, così luci, collisioni, curve camera e prestazioni restano sempre stabili).
   - La scena 3D viene caricata in **lazy loading** (`React.lazy` + `Suspense`) per non appesantire l'avvio delle rotte 2D.
   - **Gestione immagini e CORS nel 3D:** il database memorizza solo stringhe URL (`immagine_url`), senza storage binario. Per evitare blocchi CORS sulle texture WebGL, le immagini demo/mock vanno servite localmente da `public/images/` (o da domini con CORS abilitato come Wikimedia Commons), prevedendo sempre un fallback grafico procedurale.

---

## 2. Struttura delle 4 Sale dell'Hub 3D

### Sala I — Atrio di Benvenuto (Hub & Ingresso QR)
- **Atmosfera e geometria:** grande sala luminosa e spaziosa (nessun corridoio a scorrimento).
- **Orientamento:** frecce direzionali e portali architettonici chiari che guidano verso la **Sala II (Territorio)** e la **Sala III (Archivi & Connessioni)**.
- **Sezione QR:** postazione dedicata nell'atrio per inserire o scansionare un codice QR (es. `COG-001`). Risolvendo un codice dall'Hub 3D, **si apre davanti all'utente un portone** che accompagna fluidamente la camera dentro la **Sala IV** dedicata a quell'opera.

### Sala II — Galleria del Territorio ("Vicino a Te" & Mappa)
- **Atmosfera e geometria:** corridoio scorrevole lungo l'asse tramite rotella del mouse (o swipe/controlli su touch).
- **Pareti laterali (5–7 quadri fissi dinamici):** man mano che si avanza, a destra e sinistra compaiono da 5 a 7 opere/siti vicini restituiti da `GET /api/v1/opere/nearby` (con geolocalizzazione a `timeout: 5000 ms` e fallback Catania `37.5079, 15.0830`).
  - Cliccando su un'opera nella Sala II è possibile:
    - aprire la scheda/Sala IV dell'opera;
    - scegliere **"Mostra sulla mappa"**, aprendo `/map?highlight={id}` con il marker di quell'opera già evidenziato rispetto agli altri beni.
- **Parete di fondo (Tela Gigante della Mappa):** di fronte al visitatore, al termine del corridoio, campeggia la grande tela della Mappa. Cliccandoci si apre la **Mappa Interattiva Leaflet** (`/map`), dove ogni pin selezionato offre anche l'azione **"Ottieni indicazioni / Apri con Google Maps"** (`https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`).

### Sala III — Corridoio degli Archivi, Ricerca e Connessioni
- **Tappa 1 (Ingresso, lato destro) — Libro d'Archivio Interattivo:**
  - In 3D è presente un leggio/teca illuminata sulla destra; cliccandoci (o avvicinandosi) si apre un **overlay HTML/CSS a forma di libro aperto** (accessibile da tastiera, screen reader e smartphone):
    - **Pagina sinistra:** barra di ricerca testuale e filtri per categoria (`opera`, `reperto`, `documento`, `monumento`) collegati a `GET /api/v1/opere?search=...&categoria=...`.
    - **Pagina destra:** elenco dei risultati trovati, cliccabili per selezionare l'opera protagonista della Sala III.
- **Tappa 2 (Lungo le pareti) — Pannelli Verticali Alternati (Soluzione Ibrida):**
  - Il corridoio ha **lunghezza fissa** con **pannelli in formato verticale** (stile tavola/stele alta) alternati a sinistra e destra lungo il percorso (es. *Descrizione Ufficiale*, *Fonte d'Archivio*, *Narrazione / Curiosità*).
  - **Sempre cliccabili:** ogni pannello (indipendentemente dal fatto che l'anteprima testuale entri o meno nello spazio 3D) è cliccabile e apre la **vista 2D scorrevole (`museum-glass`)** con il testo completo, leggibile e accessibile.
  - **Dato mancante:** se un'opera non possiede un blocco (es. nessun `documento_archivio`), la postazione rimane fisicamente nel corridoio per non spezzare lo scorrimento della camera, ma con il **faretto spento/attenuato** e una dicitura sobria (es. *"Nessun documento d'archivio collegato"*).
  - **Stato iniziale senza ricerca:** se l'utente non ha ancora cercato nulla nel libro, lungo il corridoio appare un invito curatoriale serio (es. *"Consulta il Registro d'Archivio per interrogare le fonti storiche e ricostruire i legami tra le opere"*), mai messaggi banali.
- **Tappa 3 (Parete di fondo) — Grafo "Mappa del Tesoro / Carta Storica":**
  - Tela/pannello finale basato su `GET /api/v1/opere/{id}/related` (1 opera sorgente al centro + fino a 3 elementi collegati con `tipo_relazione` e `motivazione`).
  - Stile grafico artistico in **SVG/HTML** a mo' di **mappa del tesoro / carta storica museale**: percorsi curvi tratteggiati dorati, rosa dei venti decorativa e nodi a sigillo/tappa.
  - **Ogni nodo del grafo è cliccabile** (opera centrale o elementi collegati) e porta direttamente nella **Sala IV** dedicata all'elemento scelto.

### Sala IV — Stanza della Singola Opera (Dettaglio, Livelli & Voce)
- **Funzione:** stanza raccolta dedicata esclusivamente all'opera aperta tramite il portone della Sala I, dai quadri della Sala II, dai nodi della Sala III o dal pulsante *"Entra nella Sala 3D"* della vista 2D.
- **Pannello laterale di analisi (`museum-glass`):**
  - **Livello di competenza (`cogito_user_level`):** `bambino`, `ragazzo`, `adulto`, `esperto` salvato in `localStorage`. Pop-up/bottom-sheet alla prima visita, selettore a 1 clic sempre visibile in cima.
  - **Sintesi vocale nativa (Web Speech API):** legge sempre `narrazione.script_audio` con `lang = "it-IT"` (accessibile per non vedenti e ipovedenti), chiamando `window.speechSynthesis.cancel()` al cambio livello e all'unmount.
  - **Fonte d'archivio:** box dedicato a `DocumentoArchivioOut` (`segnatura`, `fondo`, `datazione`, `estratto_verificato`, `ente_conservazione`).
  - **Correlazioni e Q&A (`POST /api/v1/opere/{id}/ask`):**
    - Validazione client-side della domanda tra `3` e `300` caratteri con contatore visibile.
    - Se `in_scope === false`, evidenziare la risposta con un avviso visivo di domanda fuori contesto rispetto all'opera.
    - Nessun blocco IP lato frontend (eventuale rate-limiting resta responsabilità del backend).

---

## 3. Strategia di Sviluppo Dati (Mock-First)
Per sviluppare e testare tutte le viste 2D e le 4 sale 3D indipendentemente dalla disponibilità del backend FastAPI, predisporre un layer di **dati mock fittizi** basato sugli schemi `src/types/api.ts` e sui payload d'esempio presenti in `FRONTEND_CONTEXT.md`, facilmente commutabile verso le API reali `/api/v1`.
