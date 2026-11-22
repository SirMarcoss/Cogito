# COGITO — Il Museo oltre i Confini

**Cogito — Beyond the Museum** è una piattaforma web culturale ibrida **3D/2D** progettata per connettere musei, archivi storici e siti del territorio in un'unica esperienza digitale accessibile, verificata e personalizzata tramite Intelligenza Artificiale.

Attraverso la scansione di codici **QR**, l'esplorazione **geolocalizzata** sul territorio e la consultazione di un **registro archivistico 3D**, Cogito adatta dinamicamente le narrazioni storico-artistiche, l'audioguida vocale in italiano e le risposte dell'assistente AI al livello di conoscenza del visitatore (**Bambino**, **Ragazzo**, **Adulto**, **Esperto**), ancorando (*grounding*) ogni contenuto esclusivamente ai metadati ufficiali e ai documenti primari d'archivio certificati nel database.

---

## Indice

1. [Funzionalità Principali](#1-funzionalità-principali)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Architettura e Struttura del Progetto](#3-architettura-e-struttura-del-progetto)
4. [Modello Dati (PostgreSQL)](#4-modello-dati-postgresql)
5. [Riferimento API REST (`/api/v1`)](#5-riferimento-api-rest-apiv1)
6. [Installazione e Avvio in Locale](#6-installazione-e-avvio-in-locale)
7. [Variabili d'Ambiente (`.env`)](#7-variabili-dambiente-env)
8. [Build di Produzione e Deploy](#8-build-di-produzione-e-deploy)

---

## 1. Funzionalità Principali

- **Esperienza Ibrida 3D / 2D (`Three.js`)**:
  - **Ingresso Monumentale 3D (`MuseumLanding3D`)**: scena neoclassica tridimensionale interattiva guidata dallo scroll con illuminazione fisica, texture procedurali e fallback automatico per dispositivi privi di WebGL.
  - **Volume d'Archivio 3D (`ArchiveBook3D`)**: codice storico tridimensionale sfogliabile che apre il motore di ricerca paginato tra opere, reperti, documenti d'archivio e monumenti.
- **Scansione QR Ottica e Inserimento Manuale (`QrScannerModal`)**:
  - Lettura diretta tramite fotocamera del dispositivo (`html5-qrcode`) o digitazione manuale del codice identificativo (es. `COG-008`) o di un URL `/qr/:code`.
- **Esplorazione Territoriale Geolocalizzata (`HeritageMap` + Haversine)**:
  - Mappa interattiva basata su **Leaflet** e **OpenStreetMap** con filtro per categoria e raggio (`Raggio 20 km` / `Tutta la Sicilia`).
  - Calcolo geodetico **Haversine** lato backend con **fallback automatico anti-mappa vuota** sul polo culturale predefinito (`Catania`) per visitatori remoti, e integrazione diretta con Google Maps per il calcolo del percorso verso le coordinate esatte dell'opera.
- **Narrazione Adattiva AI Grounded con Pattern Cache-Aside**:
  - Generazione tramite **Google Gemini Structured Output** calibrata su 4 profili cognitivi e stilistici:
    - `bambino` *(6–11 anni)*: storytelling vivido, frasi brevi e spiegazione dei termini complessi.
    - `ragazzo` *(12–17 anni)*: taglio dinamico, dettagli visivi e legami con il territorio.
    - `adulto` *(percorso culturale)*: sintesi storico-artistica accessibile e contestualizzata.
    - `esperto` *(ricerca & archivio)*: rigore critico, lessico specialistico e riferimenti puntuali a fondi e segnature archivistiche.
  - **Cache persistente su PostgreSQL (`narrazioni_cache`)**: la prima richiesta genera e valida la narrazione salvandola su database; le visite successive per la stessa coppia `(opera_id, livello)` vengono servite istantaneamente dalla cache.
- **Audioguida Italiana Neurale Multi-Voce (`useSpeechGuide` + `neuralTtsPlugin`)**:
  - Sintesi vocale neurale in lingua italiana con 4 voci selezionabili (*Isabella*, *Elsa*, *Giuseppe*, *Diego*), lettura dello `script_audio` ottimizzato per la pronuncia (senza sigle, parentesi o abbreviazioni) e **fallback automatico su Web Speech API** del browser.
- **Grafo delle Connessioni Storico-Culturali (`ConnectionsGraph`)**:
  - Visualizzazione SVG interattiva fino a 3 opere correlate per legami storici, artistici, archivistici o territoriali.
  - **Filtro Python anti-allucinazione**: ogni ID proposto dal modello AI viene verificato contro il catalogo reale su PostgreSQL (scartando self-loop, duplicati o ID inesistenti) prima del salvataggio nella tabella `correlazioni_opere`.
- **Assistente Contestuale "Cogito AI" (`OperaQaSection`)**:
  - Drawer interattivo di domande e risposte ancorato alla singola opera e al documento d'archivio collegato, con rilevamento automatico delle domande fuori tema (`in_scope = false`) e citazione esplicita delle fonti verificate (`fonti_citate`).

---

## 2. Stack Tecnologico

### Backend (`backend/`)
| Componente | Tecnologia | Ruolo |
| :--- | :--- | :--- |
| **Framework API** | **FastAPI** (`>= 0.115.0`) + **Uvicorn** | Espone le API REST `/api/v1`, validazione request/response e documentazione OpenAPI |
| **ORM & Database** | **SQLAlchemy 2.0** (`Mapped` / `mapped_column`) + **PostgreSQL 15+** | Persistenza relazionale, eager loading (`joinedload`) anti N+1 e vincoli d'integrità |
| **Driver DB** | **psycopg v3** (`psycopg[binary] >= 3.2.0`) | Connettore PostgreSQL sincrono ad alte prestazioni |
| **Migrazioni** | **Alembic** (`>= 1.13.2`) | Versionamento dello schema database (`00d996271c59_initial_schema.py`) |
| **Validazione & Config** | **Pydantic v2** + **pydantic-settings** | DTO tipizzati, validazione rigorosa degli input e lettura `.env` |
| **Intelligenza Artificiale** | **Google GenAI SDK** (`google-genai >= 3.6.1`) | Chiamate Gemini con JSON Schema Structured Output (`store=False`) |

### Frontend (`frontend/`)
| Componente | Tecnologia | Ruolo |
| :--- | :--- | :--- |
| **UI & Routing** | **React 18** + **TypeScript 5.6** + **React Router v7** | SPA con code-splitting per rotta (`MainPage`, `OperaDetailPage`) |
| **Build Tool** | **Vite 6** | Bundler con chunking ottimizzato (`vendor-three`, `vendor-leaflet`, `vendor-qr`) e proxy API |
| **Styling** | **Tailwind CSS 3.4** | Design system editoriale museale (*panna*, *oro antico*, *inchiostro*) e tipografia *Cormorant Garamond* + *Inter* |
| **Grafica 3D** | **Three.js** (`0.160`) | Scena museale neoclassica 3D e volume d'archivio 3D interattivo |
| **Cartografia** | **Leaflet** (`1.9.4`) | Mappa interattiva dei beni culturali con pin custom e fallback tile OpenStreetMap |
| **Scansione QR** | **html5-qrcode** (`2.3.8`) | Decodifica QR code da fotocamera in tempo reale |
| **Sintesi Vocale** | **msedge-tts** + **Web Speech API** | Middleware Vite `/api/local-tts` con cache LRU in memoria e fallback nativo browser |

---

## 3. Architettura e Struttura del Progetto

```text
Cogito/
├── .env.example                           # Template variabili d'ambiente
├── .gitignore                             # Regole di esclusione Git
├── requirements.txt                       # Dipendenze Python backend
├── README.md                              # Documentazione del progetto
│
├── backend/                               # Backend REST FastAPI
│   ├── main.py                            # Entrypoint FastAPI, CORS e registrazione router /api/v1
│   ├── alembic.ini                        # Configurazione Alembic
│   ├── alembic/
│   │   ├── env.py                         # Ambiente migrazioni collegato a Settings e Base.metadata
│   │   └── versions/
│   │       └── 00d996271c59_initial_schema.py  # Migrazione schema iniziale PostgreSQL
│   ├── scripts/
│   │   └── seed.py                        # Script di popolamento idempotente del database
│   └── app/
│       ├── core/
│       │   ├── config.py                  # Configurazione tipizzata (Settings da .env)
│       │   ├── database.py                # Engine SQLAlchemy, SessionLocal e dependency get_db
│       │   └── genai_client.py            # Wrapper GenAIClient per Gemini Structured Output
│       ├── models/                        # Modelli ORM SQLAlchemy 2.0
│       │   ├── base.py                    # DeclarativeBase e naming convention constraint/indici
│       │   ├── enums.py                   # TipologiaEnte, CategoriaOpera, LivelloCompetenza
│       │   ├── ente_luogo.py              # Tabella enti_luoghi
│       │   ├── documento_archivio.py      # Tabella archivi_documenti
│       │   ├── opera.py                   # Tabella opere (con coordinate risolte e validazione QR)
│       │   ├── narrazione_cache.py        # Tabella narrazioni_cache
│       │   └── correlazione_opera.py      # Tabella correlazioni_opere
│       ├── schemas/                       # Schemi Pydantic v2 (Input/Output API & Draft AI)
│       │   ├── common.py                  # HealthResponse, ErrorResponse
│       │   ├── ente_luogo.py              # EnteOut e schemi CRUD
│       │   ├── documento_archivio.py      # DocumentoArchivioOut e schemi CRUD
│       │   ├── opera.py                   # OperaSummaryOut, OperaDetailOut, NearbyResponse
│       │   ├── narrazione_cache.py        # NarrazioneOut, AskRequest, AskResponse
│       │   ├── correlazione_opera.py      # CorrelazioneItemOut, CorrelazioniResponse
│       │   └── ai.py                      # AINarrationDraft, AICorrelationsDraft, AIAskDraft
│       ├── services/                      # Logica di business e grounding AI
│       │   ├── catalog_service.py         # Health check DB, catalogo filtrato/paginato, scheda opera
│       │   ├── qr_resolver_service.py     # Normalizzazione e lookup univoco codice QR
│       │   ├── geo_map_service.py         # Calcolo distanza Haversine e fallback sul polo culturale
│       │   ├── adaptive_narration_service.py # Cache-Aside narrazioni e Q&A contestuale grounded
│       │   └── correlation_service.py     # Cache-Aside correlazioni e filtro Python anti-allucinazione
│       └── endpoints/                     # Router FastAPI (/api/v1)
│           ├── health.py                  # GET /api/v1/health
│           ├── opere.py                   # GET /api/v1/opere, /opere/nearby, /opere/{opera_id}
│           ├── qr.py                      # GET /api/v1/qr/{qr_code}
│           └── ai.py                      # GET /narration, GET /related, POST /ask
│
└── frontend/                              # Frontend React + TypeScript + Vite
    ├── index.html                         # Entry HTML (lingua it, font Cormorant Garamond & Inter)
    ├── package.json                       # Script npm e dipendenze frontend
    ├── vite.config.ts                     # Configurazione Vite, proxy /api/v1, chunking e plugin TTS
    ├── neuralTtsPlugin.mjs                # Middleware server-side /api/local-tts (Edge Neural TTS)
    ├── vercel.json                        # Configurazione rewrite SPA per deploy Vercel
    ├── tailwind.config.js                 # Palette colori museale e configurazione Tailwind
    ├── public/
    │   ├── favicon.svg
    │   └── images/                        # Illustrazioni vettoriali SVG delle opere
    └── src/
        ├── main.tsx                       # Bootstrap React
        ├── App.tsx                        # Router principale (/ , /opera/:id , /qr/:code)
        ├── index.css                      # Stili globali, bottoni museali e animazioni
        ├── pages/
        │   ├── MainPage.tsx               # Ingresso 3D, blocco QR, mappa territoriale e archivio 3D
        │   └── OperaDetailPage.tsx        # Scheda opera, audioguida, grafo connessioni e drawer AI
        ├── components/
        │   ├── three/                     # Scene e geometrie 3D (MuseumLanding3D, ArchiveBook3D)
        │   ├── explore/                   # HeritageMap (Leaflet)
        │   ├── qr/                        # QrScannerModal e QrScanIllustration
        │   ├── opera/                     # ConnectionsGraph, OperaQaSection, AskAiIllustration
        │   └── ui/                        # LevelWelcomeModal, LevelDropdown, VoicePickerDropdown, RevealOnScroll
        ├── hooks/
        │   ├── useUserLevel.ts            # Persistenza del livello di competenza in localStorage
        │   ├── useSpeechGuide.ts          # Gestione audioguida neurale e fallback Web Speech API
        │   └── useDebounce.ts             # Debounce per la ricerca in tempo reale nell'archivio
        ├── services/
        │   ├── apiClient.ts               # Client HTTP tipizzato verso /api/v1 con gestione timeout/abort
        │   └── apiError.ts                # Classe ApiError e type guard isApiError
        ├── types/
        │   └── api.ts                     # Contratti TypeScript speculari agli schemi Pydantic backend
        └── utils/
            └── format.ts                  # Formattatori etichette, distanze, URL sicuri e parser QR
```

---

## 4. Modello Dati (PostgreSQL)

Lo schema relazionale è gestito tramite **Alembic** ([00d996271c59_initial_schema.py](backend/alembic/versions/00d996271c59_initial_schema.py)) ed è composto da 5 tabelle:

1. **`enti_luoghi`**: musei, archivi storici e siti territoriali (`id`, `nome`, `tipologia` [`museo` | `archivio` | `sito_territorio`], `indirizzo`, `citta`, `lat`, `lng`, `orari`, `sito_web`).
2. **`archivi_documenti`**: fonti documentarie primarie (`id`, `ente_id` FK verso `enti_luoghi`, `segnatura` `UNIQUE`, `fondo`, `titolo`, `datazione`, `estratto_verificato`, `immagine_url`).
3. **`opere`**: beni culturali fruibili (`id`, `qr_code` `UNIQUE` normalizzato uppercase, `titolo`, `autore`, `anno`, `categoria` [`opera` | `reperto` | `documento` | `monumento`], `sala`, `breve_sintesi`, `descrizione_ufficiale`, `immagine_url`, `ente_id` FK, `documento_archivio_id` FK opzionale, `lat`, `lng` con `CheckConstraint` di coppia e fallback automatico sulle coordinate dell'ente).
4. **`narrazioni_cache`**: cache persistente delle narrazioni AI (`id`, `opera_id` FK `ON DELETE CASCADE`, `livello` [`bambino` | `ragazzo` | `adulto` | `esperto`], `testo_lettura`, `script_audio`, `curiosita`, `fonti_citate` JSON, `created_at`) con vincolo `UNIQUE (opera_id, livello)`.
5. **`correlazioni_opere`**: cache persistente delle connessioni validate tra opere (`id`, `opera_sorgente_id` FK, `opera_destinazione_id` FK, `tipo_relazione`, `motivazione`, `created_at`) con `UNIQUE (opera_sorgente_id, opera_destinazione_id)` e `CheckConstraint (opera_sorgente_id != opera_destinazione_id)`.

---

## 5. Riferimento API REST (`/api/v1`)

Tutti gli endpoint sono esposti sotto il prefisso `/api/v1`:

| Metodo | Endpoint | Descrizione | Parametri Principali |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Verifica lo stato del server FastAPI e la connettività al database (`SELECT 1`). | — |
| `GET` | `/api/v1/opere` | Restituisce il catalogo paginato delle opere con filtri opzionali. | `categoria`, `ente_id`, `search`, `limit` (`1..100`), `offset` (`>=0`) |
| `GET` | `/api/v1/opere/nearby` | Restituisce le opere entro `radius_km` ordinate per distanza Haversine (con fallback sul polo di Catania se vuoto). | `lat` (`-90..90`), `lng` (`-180..180`), `radius_km` (`>0`), `categoria` |
| `GET` | `/api/v1/opere/{opera_id}` | Restituisce la scheda completa dell'opera, l'ente ospitante e l'eventuale documento d'archivio collegato. | `opera_id` (path) |
| `GET` | `/api/v1/qr/{qr_code}` | Normalizza un codice QR (es. `COG-001`) e restituisce la scheda dettagliata dell'opera corrispondente. | `qr_code` (path) |
| `GET` | `/api/v1/opere/{opera_id}/narration` | Restituisce la narrazione adattiva per il livello richiesto usando Cache-Aside su DB e Google Gemini. | `opera_id` (path), `livello` (`bambino` \| `ragazzo` \| `adulto` \| `esperto`) |
| `GET` | `/api/v1/opere/{opera_id}/related` | Restituisce fino a `limit` opere correlate validate contro il database. | `opera_id` (path), `limit` (`1..4`, default `3`) |
| `POST` | `/api/v1/opere/{opera_id}/ask` | Risponde in modo grounded a una domanda sull'opera segnalando eventuali domande fuori tema (`in_scope`). | Body JSON: `{ "question": "...", "livello": "adulto" }` |

> **Middleware Audio Locale (Vite dev/preview)**:
> - `POST /api/local-tts`: accetta `{ "text": "...", "voice": "it-IT-IsabellaNeural" }` e restituisce uno stream `audio/mpeg` sintetizzato tramite `msedge-tts` con cache LRU e deduplicazione delle richieste concorrenti.

---

## 6. Installazione e Avvio in Locale

### Prerequisiti
- **Python** `>= 3.11`
- **PostgreSQL** `>= 15`
- **Node.js** `>= 18` (con **npm** `>= 9`)

### Passo 1 — Configurazione Variabili d'Ambiente
Copia il file `.env.example` in `.env` nella root del progetto e imposta la stringa di connessione PostgreSQL e la tua chiave API Google Gemini:

```bash
cp .env.example .env
```

### Passo 2 — Avvio del Backend (FastAPI + PostgreSQL)
Dalla root del repository:

```bash
# 1. Crea e attiva un ambiente virtuale Python
python -m venv .venv
# Su Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Su macOS / Linux:
# source .venv/bin/activate

# 2. Installa le dipendenze del backend
pip install -r requirements.txt

# 3. Esegui le migrazioni Alembic sul database PostgreSQL
cd backend
alembic upgrade head

# 4. Avvia il server FastAPI sulla porta 8000
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Una volta avviato, la documentazione interattiva Swagger è disponibile su `http://localhost:8000/docs`.

### Passo 3 — Avvio del Frontend (React + Vite)
In un secondo terminale:

```bash
cd frontend
npm install
npm run dev
```

L'applicazione sarà accessibile su **`http://localhost:5174`** (il dev server Vite inoltra automaticamente le richieste `/api/v1/*` a `http://localhost:8000` ed espone `/api/local-tts`).

---

## 7. Variabili d'Ambiente (`.env`)

### Backend (`.env` nella root o in `backend/.env`)
| Variabile | Default | Descrizione |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/cogito` | URL di connessione PostgreSQL (i prefissi `postgres://` e `postgresql://` vengono normalizzati automaticamente su `postgresql+psycopg://`) |
| `GEMINI_API_KEY` | `None` | Chiave API per Google Gemini (`google-genai`). Se assente, gli endpoint AI rispondono `503` e il frontend mostra in fallback la descrizione ufficiale certificata |
| `GEMINI_MODEL` | `gemini-4-hydrogen` | Nome del modello Gemini utilizzato per Structured Output |
| `GEMINI_TIMEOUT_SECONDS` | `15.0` | Timeout massimo in secondi per le chiamate a Gemini |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Lista di origini CORS consentite separate da virgola (aggiungere `http://localhost:5174` o il dominio di produzione) |
| `DEFAULT_POLO_NOME` | `Catania` | Nome del polo culturale usato come fallback geografico |
| `DEFAULT_POLO_LAT` | `37.5079` | Latitudine del polo culturale di default |
| `DEFAULT_POLO_LNG` | `15.0830` | Longitudine del polo culturale di default |

### Frontend (`frontend/.env`)
| Variabile | Default | Descrizione |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api/v1` | URL base del backend REST (in produzione impostare l'URL pubblico del backend, es. `https://api.tuodominio.it/api/v1`) |

---

## 8. Build di Produzione e Deploy

### Verifica Type-Check e Build Frontend
```bash
cd frontend
npm run typecheck    # Esegue tsc --noEmit
npm run build        # Compila e genera i bundle ottimizzati in frontend/dist/
npm run preview      # Avvia l'anteprima della build sulla porta 5174
```

### Deploy Frontend su Vercel
La cartella `frontend/` include il file [vercel.json](frontend/vercel.json) già configurato per il routing SPA (`"source": "/((?!api/).*)" -> "/index.html"`):
1. Imposta **`frontend`** come *Root Directory* del progetto su Vercel.
2. Configura la variabile d'ambiente `VITE_API_BASE_URL` puntandola all'URL del backend FastAPI in produzione.
3. Assicurati che nel backend `CORS_ORIGINS` includa il dominio Vercel del frontend.
