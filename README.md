# COGITO — Il Museo oltre i Confini

## Descrizione del Progetto

**Cogito — Beyond the Museum** è una piattaforma web culturale ibrida **3D/2D** che supera i confini fisici del museo tradizionale per connettere in un unico ecosistema digitale **collezioni museali, archivi storici e siti del territorio**.

Il progetto trasforma la visita culturale da fruizione statica e uguale per tutti a un percorso **dinamico, accessibile e verificato**: grazie all'integrazione tra grafica tridimensionale interattiva, geolocalizzazione, scansione di codici QR e Intelligenza Artificiale generativa *grounded*, ogni opera o monumento viene raccontato in tempo reale adattando linguaggio, registro stilistico e profondità critica al profilo del visitatore, mantenendo come unica fonte di verità i metadati ufficiali e i documenti primari d'archivio.

---

## Obiettivi

1. **Superare la barriera tra museo ed esterno (*Beyond the Museum*)**: mettere in dialogo le opere esposte nelle sale museali con i monumenti diffusi sul territorio e con i documenti storici custoditi negli archivi di Stato e civici, rendendo visibili i legami che uniscono il patrimonio culturale.
2. **Accessibilità cognitiva e personalizzazione**: offrire a ogni visitatore — dal bambino della scuola primaria allo studioso specialista — una narrazione scritta e vocale calibrata sul proprio livello di comprensione, senza mai sacrificare l'accuratezza storica.
3. **Affidabilità scientifica e *zero allucinazioni* (*Grounding*)**: vincolare l'Intelligenza Artificiale esclusivamente alle schede catalografiche certificate e agli estratti verificati dei documenti d'archivio presenti nel database, citando sempre le fonti ufficiali e le segnature archivistiche.
4. **Continuità tra esperienza immersiva e consultazione rapida**: combinare l'impatto visivo di un ambiente museale 3D con l'immediatezza di un'interfaccia editoriale 2D ottimizzata per l'uso in mobilità davanti all'opera.

---

## Funzionalità

- **Ingresso Monumentale 3D e Registro d'Archivio 3D**:
  - **Museo Neoclassico 3D**: esperienza d'ingresso tridimensionale guidata dallo scroll che accompagna il visitatore all'interno della piattaforma.
  - **Volume d'Archivio 3D**: codice storico tridimensionale sfogliabile per esplorare e filtrare il catalogo certificato di opere, reperti, documenti e monumenti.
- **Riconoscimento Opera tramite QR Code**:
  - Scansione ottica immediata del cartellino dell'opera tramite fotocamera o inserimento manuale del codice identificativo per accedere direttamente alla scheda dedicata.
- **Mappa Territoriale Interattiva e Geolocalizzazione**:
  - Esplorazione geografica dei beni culturali vicini alla posizione del visitatore (calcolo geodetico **Haversine**), filtri per categoria, vista locale o regionale e collegamento diretto alla navigazione stradale/pedonale verso il bene.
- **Narrazione Adattiva AI su 4 Livelli di Competenza**:
  - Rielaborazione automatica dei contenuti ufficiali su quattro profili selezionabili in qualsiasi momento:
    - **Bambino (6–11 anni)**: racconto vivido, semplice e curioso.
    - **Ragazzo (12–17 anni)**: taglio diretto, dinamico e connesso al contesto storico-territoriale.
    - **Adulto**: narrazione culturale equilibrata e scorrevole.
    - **Esperto**: analisi storico-critica rigorosa con terminologia tecnica e riferimenti alle segnature archivistiche.
- **Audioguida Italiana Neurale Multi-Voce**:
  - Lettura vocale espressiva in lingua italiana con scelta tra 4 voci narranti (*Isabella*, *Elsa*, *Giuseppe*, *Diego*), basata su uno script audio appositamente generato senza sigle o abbreviazioni per garantire una pronuncia naturale.
- **Grafo Visivo delle Connessioni Storico-Culturali**:
  - Mappa relazionale interattiva che collega ogni opera ad altri beni del catalogo per affinità storica, artistica, archivistica o territoriale, validata sul database per garantire che ogni collegamento rimandi a un bene realmente censito.
- **Assistente Contestuale "Cogito AI"**:
  - Spazio di dialogo dedicato su ciascuna scheda opera per porre domande libere o approfondire curiosità, con risposte ancorate alle fonti storiche del bene e riconoscimento automatico delle domande fuori tema.

---

## Stack Tecnologico

### Frontend
- **React 18** & **TypeScript**: architettura a componenti tipizzata con gestione reattiva dello stato e del livello utente.
- **Vite 6**: bundler moderno con code-splitting modulare.
- **Tailwind CSS**: design system editoriale ispirato all'estetica museale (*panna*, *oro antico*, *inchiostro*) e tipografia *Cormorant Garamond* + *Inter*.
- **Three.js (WebGL)**: rendering 3D in tempo reale del museo neoclassico e del volume d'archivio interattivo.
- **Leaflet & OpenStreetMap**: cartografia interattiva per l'esplorazione geolocalizzata sul territorio.
- **html5-qrcode**: acquisizione e decodifica QR code da fotocamera.
- **Microsoft Edge Neural TTS & Web Speech API**: sintesi vocale neurale in italiano con fallback nativo sul sintetizzatore del browser.

### Backend & AI
- **Python 3.11+** & **FastAPI**: architettura REST ad alte prestazioni per catalogo, risoluzione QR, ricerca geospaziale e servizi AI.
- **PostgreSQL 15+**, **SQLAlchemy 2.0** & **Alembic**: database relazionale per la gestione di enti, documenti d'archivio, opere e livello di caching persistente (*Cache-Aside*) di narrazioni e correlazioni.
- **Pydantic v2**: validazione formale dei contratti dati e degli schemi JSON strutturati.
- **Google Gemini AI (`google-genai` SDK)**: generazione controllata tramite *Structured Output* per narrazioni adattive, individuazione di correlazioni culturali e Q&A contestuale *grounded*.
