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
