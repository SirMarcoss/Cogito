# PROJECT CONTEXT: FRONTEND ARCHITECT & FULL TECHNICAL SPECIFICATION — COGITO ("BEYOND THE MUSEUM")

## 1. Ruolo, Standard Professionale e Obiettivi di Prodotto
Agisci come un Senior Frontend Architect & UI/UX Engineer specializzato in applicazioni web ad alte prestazioni, design system accessibili e interfacce per i beni culturali (Cultural Heritage). Il tuo compito è progettare e sviluppare il frontend di **Cogito** (*"Beyond the Museum"*, web-app guest-first dedicata alla fruizione dei beni culturali), integrandolo perfettamente con il backend FastAPI esistente.

### Principi Architetturali e Obiettivi:
- **Connessione tra Opere e Fonti d'Archivio:** Mettere in risalto non solo le opere esposte, ma anche i documenti d'archivio collegati (segnature, fondi, estratti verificati) e le relazioni storiche tra reperti e luoghi diversi.
- **Esperienza Mobile-First e Accesso Immediato:** L'utente accede principalmente da smartphone inquadrando un QR code nel museo o in città. L'interfaccia deve caricarsi istantaneamente nel browser senza richiedere download, registrazioni, login o credenziali.
- **Accessibilità (WCAG 2.1 AA) e Narrazione Adattiva:** HTML semantico, contrasti cromatici elevati, gerarchie tipografiche chiare, supporto screen-reader (`aria-label`), focus visibili, narrazione modulata per fasce d'età/competenza e sintesi vocale integrata via Web Speech API.
- **Connessione Territoriale ("Beyond the Museum"):** Mappa interattiva che connette fisicamente e narrativamente le opere nei musei ai luoghi storici reali del territorio circostante da cui provengono.
- **Manutenibilità e Resilienza dell'Architettura:** Codice pulito, modulare, disaccoppiato dalla logica di fetching, con skeleton loader eleganti, gestione controllata degli errori HTTP e fallback visivi in caso di dati mancanti o latenza AI.
- **Sicurezza e Privacy by Design:** Non inserire mai chiavi API, token privati o credenziali hardcoded nel codice frontend; nessuna raccolta di dati personali (approccio 100% guest/stateless).

---

## 2. Convenzioni Generali e Configurazione
- **Base URL:** `/api/v1` (es. locale `http://localhost:8000/api/v1`, produzione `https://<tuo-backend>.onrender.com/api/v1`).
- **Autenticazione:** Nessuna (API completamente stateless e pubbliche in lettura, pensate per garantire accesso immediato senza registrazione).
- **Formato dati:** `application/json; charset=utf-8` sia in request che in response.
- **Documentazione interattiva:** Avviando FastAPI, è possibile testare tutto su `GET /docs` (Swagger UI) o scaricare lo schema da `GET /openapi.json`.
- **CORS:** Il backend espone `CORSMiddleware` con `allow_origins` configurato sull'URL di sviluppo locale del frontend (`http://localhost:3000` o `http://localhost:5173`) e sul dominio Vercel di produzione.

---

## 3. Enum Condivisi (Dominio)
Questi 3 enum costituiscono il vocabolario unico condiviso tra DB, Backend e Frontend:

```python
from enum import Enum

class TipologiaEnte(str, Enum):
    MUSEO = "museo"
    ARCHIVIO = "archivio"
    SITO_TERRITORIO = "sito_territorio"

class CategoriaOpera(str, Enum):
    OPERA = "opera"          # Dipinti, sculture, installazioni in museo
    REPERTO = "reperto"      # Reperti archeologici o storici
    DOCUMENTO = "documento"  # Manoscritti, mappe, atti, foto d'archivio
    MONUMENTO = "monumento"  # Beni architettonici o luoghi all'aperto

class LivelloCompetenza(str, Enum):
    BAMBINO = "bambino"      # 6-11 anni: storytelling semplice, tono curioso
    RAGAZZO = "ragazzo"      # 12-17 anni: diretto, dinamico, collegamenti visivi
    ADULTO = "adulto"        # Narrazione culturale accessibile ed equilibrata
    ESPERTO = "esperto"      # Rigore storico, metadati archivistici, contesto critico
```

---

## 4. Architettura Dati Backend (Modelli SQLAlchemy 2.0 — 5 Tabelle)
Riferimento strutturale del modello dati: la relazione non è `Opera → Archivio → Museo`, ma `Opera → EnteLuogo` (obbligatoria) e `Opera → DocumentoArchivio` (opzionale/nullable), dove anche `DocumentoArchivio` punta a un `EnteLuogo`. In questo modo un dipinto in museo può essere collegato a un documento conservato in un Archivio di Stato esterno, e un monumento all'aperto può esistere senza archivio.

```python
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    DateTime, Enum as SQLEnum, Float, ForeignKey, Integer,
    JSON, String, Text, UniqueConstraint, func
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

# 1. ENTI E LUOGHI (Musei, Archivi, Siti sul territorio)
class EnteLuogo(Base):
    __tablename__ = "enti_luoghi"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    tipologia: Mapped[TipologiaEnte] = mapped_column(SQLEnum(TipologiaEnte), nullable=False)
    indirizzo: Mapped[str] = mapped_column(String(255), nullable=False)
    citta: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    orari: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sito_web: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    opere: Mapped[list["Opera"]] = relationship(back_populates="ente")
    documenti: Mapped[list["DocumentoArchivio"]] = relationship(back_populates="ente")

# 2. DOCUMENTI D'ARCHIVIO (Gestione fondi e fonti primarie)
class DocumentoArchivio(Base):
    __tablename__ = "archivi_documenti"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ente_id: Mapped[int] = mapped_column(ForeignKey("enti_luoghi.id"), nullable=False)
    segnatura: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # Es. "ASC-1842-B12"
    fondo: Mapped[str] = mapped_column(String(200), nullable=False)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    datazione: Mapped[str] = mapped_column(String(100), nullable=False)
    estratto_verificato: Mapped[str] = mapped_column(Text, nullable=False)
    immagine_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    ente: Mapped["EnteLuogo"] = relationship(back_populates="documenti")
    opere_collegate: Mapped[list["Opera"]] = relationship(back_populates="documento_archivio")

# 3. OPERE E BENI CULTURALI
class Opera(Base):
    __tablename__ = "opere"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    qr_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)  # Es. "COG-001"
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    autore: Mapped[str] = mapped_column(String(200), nullable=False)
    anno: Mapped[str] = mapped_column(String(50), nullable=False)  # Stringa per gestire "IV sec. a.C." o "1608 ca."
    categoria: Mapped[CategoriaOpera] = mapped_column(SQLEnum(CategoriaOpera), nullable=False, index=True)
    sala: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    breve_sintesi: Mapped[str] = mapped_column(String(300), nullable=False)  # Testo breve per card e pin mappa
    descrizione_ufficiale: Mapped[str] = mapped_column(Text, nullable=False) # Fonte verificata per grounding AI
    immagine_url: Mapped[str] = mapped_column(String(500), nullable=False)

    ente_id: Mapped[int] = mapped_column(ForeignKey("enti_luoghi.id"), nullable=False)
    documento_archivio_id: Mapped[Optional[int]] = mapped_column(ForeignKey("archivi_documenti.id"), nullable=True)

    # Coordinate opzionali: se NULL, il backend espone automaticamente ente.lat e ente.lng
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    ente: Mapped["EnteLuogo"] = relationship(back_populates="opere")
    documento_archivio: Mapped[Optional["DocumentoArchivio"]] = relationship(back_populates="opere_collegate")

# 4. CACHE NARRAZIONI AI (Pattern Cache-Aside per ottimizzazione latenza)
class NarrazioneCache(Base):
    __tablename__ = "narrazioni_cache"
    __table_args__ = (UniqueConstraint("opera_id", "livello", name="uq_opera_livello"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    opera_id: Mapped[int] = mapped_column(ForeignKey("opere.id", ondelete="CASCADE"), nullable=False, index=True)
    livello: Mapped[LivelloCompetenza] = mapped_column(SQLEnum(LivelloCompetenza), nullable=False)
    testo_lettura: Mapped[str] = mapped_column(Text, nullable=False)
    script_audio: Mapped[str] = mapped_column(Text, nullable=False)  # Ottimizzato per Web Speech API
    curiosita: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fonti_citate: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

# 5. CACHE CORRELAZIONI AI TRA OPERE (Consistenza relazionale + bassa latenza)
class CorrelazioneOpera(Base):
    __tablename__ = "correlazioni_opere"
    __table_args__ = (UniqueConstraint("opera_sorgente_id", "opera_destinazione_id", name="uq_correlazione_coppia"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    opera_sorgente_id: Mapped[int] = mapped_column(ForeignKey("opere.id", ondelete="CASCADE"), nullable=False, index=True)
    opera_destinazione_id: Mapped[int] = mapped_column(ForeignKey("opere.id", ondelete="CASCADE"), nullable=False)
    tipo_relazione: Mapped[str] = mapped_column(String(80), nullable=False)  # Es. "contesto_storico", "stesso_autore", "territorio"
    motivazione: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

---

## 5. Schemi Pydantic v2 (Contratto API Lato Server)
Nota per semplificare il frontend: il backend risolve sempre `lat` e `lng` effettivi (`opera.lat if opera.lat is not None else opera.ente.lat`), così il frontend riceve sempre due float garantiti e non deve gestire valori null su Leaflet. (Nota backend: per `google-genai`, vengono usati due schemi interni separati `AINarrationDraft` e `AICorrelationsDraft` passati a `response_schema` nel SDK Gemini per validare l'output prima del salvataggio in DB).

```python
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

# --- ENTI & ARCHIVI ---
class EnteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    tipologia: TipologiaEnte
    indirizzo: str
    citta: str
    lat: float
    lng: float
    orari: Optional[str] = None
    sito_web: Optional[str] = None

class DocumentoArchivioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    segnatura: str
    fondo: str
    titolo: str
    datazione: str
    estratto_verificato: str
    immagine_url: Optional[str] = None
    ente_conservazione: str  # Popolato dal backend con documento.ente.nome

# --- OPERE (Lista, Dettaglio, Mappa) ---
class OperaSummaryOut(BaseModel):
    """Usato nelle card della Home, nella ricerca e dentro le correlazioni."""
    id: int
    qr_code: str
    titolo: str
    autore: str
    anno: str
    categoria: CategoriaOpera
    sala: Optional[str] = None
    breve_sintesi: str
    immagine_url: str
    ente_id: int
    ente_nome: str
    citta: str
    lat: float  # Già risolto dal backend
    lng: float  # Già risolto dal backend
    has_archivio: bool

class OperaDetailOut(OperaSummaryOut):
    """Usato nella pagina di dettaglio opera e nella risoluzione QR."""
    descrizione_ufficiale: str
    ente: EnteOut
    documento_archivio: Optional[DocumentoArchivioOut] = None

class OperaListResponse(BaseModel):
    total: int
    items: list[OperaSummaryOut]

# --- GEOLOCALIZZAZIONE / HAVERSINE ---
class OperaNearbyOut(OperaSummaryOut):
    distance_km: float = Field(..., description="Distanza calcolata via Haversine arrotondata a 2 decimali")

class NearbyResponse(BaseModel):
    user_lat: float
    user_lng: float
    radius_km: float
    fallback_used: bool = Field(
        ..., description="True se entro radius_km non ci sono opere e il backend restituisce il polo di default"
    )
    fallback_message: Optional[str] = None
    total: int
    items: list[OperaNearbyOut]

# --- NARRAZIONE AI ADATTIVA ---
class NarrazioneOut(BaseModel):
    opera_id: int
    livello: LivelloCompetenza
    testo_lettura: str
    script_audio: str = Field(..., description="Testo pulito senza sigle/parentesi pronto per Web Speech API")
    curiosita: Optional[str] = None
    fonti_citate: list[str]
    from_cache: bool

# --- CORRELAZIONI AI ---
class CorrelazioneItemOut(BaseModel):
    tipo_relazione: str
    motivazione: str
    opera: OperaSummaryOut

class CorrelazioniResponse(BaseModel):
    opera_sorgente_id: int
    from_cache: bool
    correlazioni: list[CorrelazioneItemOut]

# --- Q&A OPZIONALE SULL'OPERA ---
class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=300)
    livello: LivelloCompetenza = LivelloCompetenza.ADULTO

class AskResponse(BaseModel):
    opera_id: int
    answer: str
    in_scope: bool = Field(..., description="False se la domanda era fuori tema rispetto all'opera")
    fonti_citate: list[str]

# --- ERRORE STANDARD ---
class ErrorResponse(BaseModel):
    detail: str
    error_code: str
```

---

## 6. Servizi Backend ed Endpoint REST
(Nota di routing backend: `GET /api/v1/opere/nearby` è registrato prima di `GET /api/v1/opere/{opera_id}` per evitare conflitti di parsing intero).

| Metodo | Endpoint | Parametri | Risposta (200 OK) | Servizio Backend |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | — | `{"status": "ok"}` | Health Check (anti cold-start) |
| `GET` | `/api/v1/opere` | Query: `categoria`, `ente_id`, `search`, `limit=50`, `offset=0` | `OperaListResponse` | `CatalogService` |
| `GET` | `/api/v1/opere/nearby` | Query: `lat` (req), `lng` (req), `radius_km=20.0`, `categoria` | `NearbyResponse` | `GeoMapService` (Haversine + Fallback) |
| `GET` | `/api/v1/opere/{opera_id}` | Path: `opera_id: int` | `OperaDetailOut` | `CatalogService` |
| `GET` | `/api/v1/qr/{qr_code}` | Path: `qr_code: str` (case-insensitive) | `OperaDetailOut` | `QRResolverService` |
| `GET` | `/api/v1/opere/{opera_id}/narration` | Path: `opera_id: int`, Query: `livello` (req) | `NarrazioneOut` | `AdaptiveNarrationService` (Gemini + Cache) |
| `GET` | `/api/v1/opere/{opera_id}/related` | Path: `opera_id: int`, Query: `limit=3` | `CorrelazioniResponse` | `CorrelationService` (Gemini + Validazione ID + Cache) |
| `POST` | `/api/v1/opere/{opera_id}/ask` (opz.) | Path: `opera_id: int`, Body: `AskRequest` | `AskResponse` | `AdaptiveNarrationService` (Q&A Grounded) |

---

## 7. Esempi di Payload JSON (Per Mock e Sviluppo Indipendente)

### `GET /api/v1/opere/nearby?lat=37.5079&lng=15.0830&radius_km=20`
```json
{
  "user_lat": 37.5079,
  "user_lng": 15.083,
  "radius_km": 20.0,
  "fallback_used": false,
  "fallback_message": null,
  "total": 1,
  "items": [
    {
      "id": 1,
      "qr_code": "COG-001",
      "titolo": "Castello Ursino — Portale Svevo",
      "autore": "Riccardo da Lentini",
      "anno": "1239-1250",
      "categoria": "monumento",
      "sala": "Corte Interna",
      "breve_sintesi": "Fortezza federiciana costruita sul promontorio lavico e sopravvissuta all'eruzione del 1669.",
      "immagine_url": "https://...",
      "ente_id": 1,
      "ente_nome": "Museo Civico Castello Ursino",
      "citta": "Catania",
      "lat": 37.4989,
      "lng": 15.0846,
      "has_archivio": true,
      "distance_km": 1.01
    }
  ]
}
```

### `GET /api/v1/opere/1/narration?livello=bambino`
```json
{
  "opera_id": 1,
  "livello": "bambino",
  "testo_lettura": "Immagina un castello costruito proprio in riva al mare quasi ottocento anni fa...",
  "script_audio": "Immagina un castello costruito proprio in riva al mare quasi ottocento anni fa. Nel milleseicentosessantanove la lava dell'Etna lo circondò senza riuscire a distruggerlo.",
  "curiosita": "Sapevi che un tempo le onde del mare arrivavano fin sotto le mura di questo castello?",
  "fonti_citate": ["Museo Civico Castello Ursino", "Archivio Storico Comunale — Fondo 1669, B.14"],
  "from_cache": true
}
```

### `GET /api/v1/opere/1/related`
```json
{
  "opera_sorgente_id": 1,
  "from_cache": true,
  "correlazioni": [
    {
      "tipo_relazione": "evento_storico",
      "motivazione": "Questa mappa d'archivio mostra esattamente il percorso della colata lavica del 1669 che circondò le mura del Castello Ursino.",
      "opera": {
        "id": 4,
        "qr_code": "COG-004",
        "titolo": "Pianta della colata lavica del 1669",
        "autore": "Anonimo cartografo",
        "anno": "1669",
        "categoria": "documento",
        "sala": "Archivio Storico (Fondo Mappe)",
        "breve_sintesi": "Rappresentazione storica dell'avanzata della lava verso le mura di Catania.",
        "immagine_url": "https://...",
        "ente_id": 2,
        "ente_nome": "Archivio Storico Comunale di Catania",
        "citta": "Catania",
        "lat": 37.5034,
        "lng": 15.0867,
        "has_archivio": true
      }
    }
  ]
}
```

---

## 8. File `src/types/api.ts` (Contratto TypeScript Obbligatorio)
Usa esattamente queste definizioni in `src/types/api.ts` per garantire type-safety completa fin dal minuto zero:

```typescript
export type TipologiaEnte = "museo" | "archivio" | "sito_territorio";
export type CategoriaOpera = "opera" | "reperto" | "documento" | "monumento";
export type LivelloCompetenza = "bambino" | "ragazzo" | "adulto" | "esperto";

export interface EnteOut {
  id: number;
  nome: string;
  tipologia: TipologiaEnte;
  indirizzo: string;
  citta: string;
  lat: number;
  lng: number;
  orari: string | null;
  sito_web: string | null;
}

export interface DocumentoArchivioOut {
  id: number;
  segnatura: string;
  fondo: string;
  titolo: string;
  datazione: string;
  estratto_verificato: string;
  immagine_url: string | null;
  ente_conservazione: string;
}

export interface OperaSummaryOut {
  id: number;
  qr_code: string;
  titolo: string;
  autore: string;
  anno: string;
  categoria: CategoriaOpera;
  sala: string | null;
  breve_sintesi: string;
  immagine_url: string;
  ente_id: number;
  ente_nome: string;
  citta: string;
  lat: number;
  lng: number;
  has_archivio: boolean;
}

export interface OperaDetailOut extends OperaSummaryOut {
  descrizione_ufficiale: string;
  ente: EnteOut;
  documento_archivio: DocumentoArchivioOut | null;
}

export interface OperaListResponse {
  total: number;
  items: OperaSummaryOut[];
}

export interface OperaNearbyOut extends OperaSummaryOut {
  distance_km: number;
}

export interface NearbyResponse {
  user_lat: number;
  user_lng: number;
  radius_km: number;
  fallback_used: boolean;
  fallback_message: string | null;
  total: number;
  items: OperaNearbyOut[];
}

export interface NarrazioneOut {
  opera_id: number;
  livello: LivelloCompetenza;
  testo_lettura: string;
  script_audio: string;
  curiosita: string | null;
  fonti_citate: string[];
  from_cache: boolean;
}

export interface CorrelazioneItemOut {
  tipo_relazione: string;
  motivazione: string;
  opera: OperaSummaryOut;
}

export interface CorrelazioniResponse {
  opera_sorgente_id: number;
  from_cache: boolean;
  correlazioni: CorrelazioneItemOut[];
}

export interface AskRequest {
  question: string;
  livello: LivelloCompetenza;
}

export interface AskResponse {
  opera_id: number;
  answer: string;
  in_scope: boolean;
  fonti_citate: string[];
}

export interface ApiErrorResponse {
  detail: string;
  error_code: string;
}
```

---

## 9. Regole Operative di Integrazione Frontend (Obbligatorie)

### Gestione livello senza login (`localStorage`):
- Chiave obbligatoria: `cogito_user_level`.
- Quando l'utente clicca su un'opera: se `localStorage.getItem("cogito_user_level")` è vuoto, apri un pop-up / bottom-sheet di scelta livello (`bambino`, `ragazzo`, `adulto`, `esperto`), salva la scelta e chiama `GET /opere/{id}/narration?livello=...`.
- Se è già salvato, carica subito la narrazione senza mostrare di nuovo il pop-up, ma lascia un selettore visibile in cima alla scheda per cambiare livello in 1 clic.

### Gestione Geolocalizzazione e Fallback Mappa:
- All'apertura della mappa chiama `navigator.geolocation.getCurrentPosition(..., { timeout: 5000 })`.
- Se l'utente accetta: chiama `GET /api/v1/opere/nearby?lat=...&lng=...&radius_km=20`. Se la risposta ha `fallback_used: true`, mostra un banner discreto in alto con `fallback_message` (es. `"Nessuna opera entro 20 km — stai esplorando il polo di Catania"`).
- Se l'utente nega il permesso o va in timeout (5000 ms): chiama comunque `GET /api/v1/opere/nearby?lat=37.5079&lng=15.0830&radius_km=20` (coordinate di default della città del polo) mostrando un bottone `"Usa la mia posizione"`.

### Audio AI via Web Speech API (Zero problemi di memoria/audio sovrapposto):
- Passa al browser `narrazione.script_audio` (non `testo_lettura`), con `utterance.lang = "it-IT"`.
- Regola critica: chiama sempre `window.speechSynthesis.cancel()` sia quando l'utente cambia livello di competenza, sia nel cleanup dello `useEffect` quando cambia pagina, altrimenti la voce continua a parlare anche dopo essere usciti dalla scheda.

### Deep-Link per Codice QR:
- Crea una route dedicata sul frontend: `/qr/[code]` (es. `https://cogito.vercel.app/qr/COG-001`).
- Quella pagina chiama `GET /api/v1/qr/COG-001` e renderizza direttamente la scheda opera (o reindirizza a `/opera/{id}`).

### Loading States & Latenza AI:
- `GET /opere/{id}` risponde in ~20 ms: renderizza subito foto, titolo, autore, `descrizione_ufficiale`, dati dell'ente e (se presente) il documento d'archivio collegato.
- `GET /opere/{id}/narration` e `GET /opere/{id}/related` vanno chiamati in parallelo in modo asincrono con uno skeleton loader dedicato: se sono in cache arrivano in ~20 ms, se è una cache miss impiegano 2–4 secondi. Non bloccare mai il rendering dell'intera pagina in attesa di Gemini.

### Codici di Errore HTTP da Gestire in UI:
- `404` (`OPERA_NOT_FOUND` / `QR_NOT_FOUND`): mostra schermata amichevole `"Opera o codice QR non trovato"` con bottone `"Torna alla mappa"`.
- `422`: parametri query non validi (es. livello errato o coordinate mancanti).
- `502` / `503` (`AI_SERVICE_UNAVAILABLE`): se Gemini va in timeout su una richiesta non in cache, gestisci l'errore in modo controllato facendo fallback sulla `descrizione_ufficiale` già presente in scheda, così l'utente non vede mai una schermata bianca o bloccata.

### Struttura Cartelle Frontend:
```text
└── frontend/                          # Web-app React + Vite + TypeScript (Mobile-first & Guest-first)
    ├── .cursorrules                   # Copia/sintesi del context per letture automatiche dell'AI
    ├── docs/                          # Specifiche e linee guida dedicate al Frontend
    │   ├── FRONTEND_CONTEXT.md        # <-- Project Context integrale per l'AI Frontend
    │   └── inspiration/               # Riferimenti strutturali e UI/UX
    │       ├── README.md
    │       └── museo_palazzo_aurelia_galleria_virtuale_3d.html
    ├── src/
    │   ├── types/
    │   │   └── api.ts                 # Contratto TypeScript condiviso (EnteOut, OperaDetailOut, ecc.)
    │   ├── services/
    │   │   └── apiClient.ts           # Chiamate fetch verso /api/v1
    │   ├── hooks/
    │   │   ├── useSpeechNarration.ts  # Gestione Web Speech API + cleanup cancel()
    │   │   └── useUserLevel.ts        # Gestione localStorage ("cogito_user_level")
    │   ├── pages/
    │   │   ├── qr/[code].tsx          # Deep-link per scansione QR (/qr/COG-001)
    │   │   ├── opera/[id].tsx         # Scheda opera + narrazione adattiva + box archivio + Q&A
    │   │   └── map.tsx                # Mappa Leaflet/OSM con geolocalizzazione e fallback
    │   └── components/
    └── package.json
```

---

## 10. Riferimento Strutturale e Ispirazione UI/UX (`docs/inspiration/`)
Per l'architettura dettagliata delle **4 sale dell'Hub 3D**, il flusso ibrido 2D/3D da QR e i dettagli interattivi (Libro d'Archivio, pannelli verticali, grafo "Mappa del Tesoro"), consulta [`UX_3D_ARCHITECTURE.md`](./UX_3D_ARCHITECTURE.md).

Il prototipo HTML [`museo_palazzo_aurelia_galleria_virtuale_3d.html`](./inspiration/museo_palazzo_aurelia_galleria_virtuale_3d.html) costituisce il riferimento concettuale e strutturale per il design della web-app Cogito:
- **Estetica museale editoriale:** palette scura ad alto contrasto (`#0b0b0c`) con accenti oro (`#c9a86a`, `#e4cc9a`), pannelli `museum-glass` in glassmorphism e tipografia serif editoriale (`Cormorant Garamond`) abbinata a sans-serif pulito (`Inter`).
- **Navigazione spaziale + HUD contestuale:** percorso 3D in Three.js (`THREE.ACESFilmicToneMapping`, texture PBR procedurali, percorso camera `CatmullRomCurve3`, raycasting sulle opere), indicatore della sala corrente, pillola di prossimità in basso e modale planimetria/mappa sale.
- **Pannello laterale di ispezione e analisi:** scheda a comparsa laterale con badge sala/ente, scheda tecnica, punti focali interattivi (zoom guidato sui dettagli) e tab di approfondimento strutturate, facilmente adattabile in Cogito per ospitare narrazione AI adattiva, citazione d'archivio verificata, sintesi vocale Web Speech API e Q&A.
