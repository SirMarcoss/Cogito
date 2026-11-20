import type {
  CorrelazioneItemOut,
  DocumentoArchivioOut,
  EnteOut,
  LivelloCompetenza,
  NarrazioneOut,
  OperaDetailOut,
  OperaSummaryOut,
} from "../types/api";

/** Polo territoriale di riferimento per il fallback geolocalizzazione (Catania). */
export const CATANIA_POLE_COORDS = {
  lat: 37.5079,
  lng: 15.083,
  radiusKm: 20,
} as const;

export const MOCK_ENTI: readonly EnteOut[] = [
  {
    id: 1,
    nome: "Museo Civico Castello Ursino",
    tipologia: "museo",
    indirizzo: "Piazza Federico II di Svevia",
    citta: "Catania",
    lat: 37.4989,
    lng: 15.0846,
    orari: "Lun–Dom 09:30–19:00",
    sito_web: "https://www.comune.catania.it/castello-ursino",
  },
  {
    id: 2,
    nome: "Archivio Storico Comunale di Catania",
    tipologia: "archivio",
    indirizzo: "Via Vittorio Emanuele II, 121",
    citta: "Catania",
    lat: 37.5034,
    lng: 15.0867,
    orari: "Lun–Ven 08:30–13:30",
    sito_web: null,
  },
  {
    id: 3,
    nome: "Museo Diocesano di Catania",
    tipologia: "museo",
    indirizzo: "Via Etnea, 8",
    citta: "Catania",
    lat: 37.5023,
    lng: 15.0878,
    orari: "Mar–Sab 09:00–17:00",
    sito_web: null,
  },
  {
    id: 4,
    nome: "Parco Archeologico Greco-Romano di Catania",
    tipologia: "sito_territorio",
    indirizzo: "Piazza Stesicoro / Via Vittorio Emanuele II",
    citta: "Catania",
    lat: 37.5074,
    lng: 15.0853,
    orari: "Tutti i giorni 09:00–18:00",
    sito_web: null,
  },
  {
    id: 5,
    nome: "Museo Civico Belliniano",
    tipologia: "museo",
    indirizzo: "Piazza San Francesco d'Assisi, 3",
    citta: "Catania",
    lat: 37.5019,
    lng: 15.0836,
    orari: "Lun–Sab 09:00–19:00",
    sito_web: null,
  },
  {
    id: 6,
    nome: "Monastero dei Benedettini di San Nicolò l'Arena",
    tipologia: "sito_territorio",
    indirizzo: "Piazza Dante Alighieri, 32",
    citta: "Catania",
    lat: 37.5037,
    lng: 15.0799,
    orari: "Tutti i giorni 09:00–17:00",
    sito_web: null,
  },
];

export const MOCK_DOCUMENTI: readonly DocumentoArchivioOut[] = [
  {
    id: 101,
    segnatura: "ASC-1669-B14",
    fondo: "Fondo Senato Cittadino — Relazioni dell'Eruzione 1669",
    titolo: "Registro delle difese urbane presso il Castello Ursino",
    datazione: "Marzo–Giugno 1669",
    estratto_verificato:
      "La colata di fuoco giunta fino alle fosse del Castellum Ursini piegò attorno ai bastioni meridionali, lasciando intatta la cortina sveva e il portale principale nonostante l'innalzamento del suolo.",
    immagine_url: "/images/pianta-1669.svg",
    ente_conservazione: "Archivio Storico Comunale di Catania",
  },
  {
    id: 102,
    segnatura: "SBB-1780-C04",
    fondo: "Fondo Biscari — Inventario Antichità e Scavi",
    titolo: "Nota di rinvenimento delle sculture imperiali nel Teatro",
    datazione: "14 ottobre 1780",
    estratto_verificato:
      "Estratto dalle murature del settore occidentale un torso loricato in marmo bianco di pregevole fattura, trasportato al Museo Biscari per la conservazione e lo studio epigrafico.",
    immagine_url: null,
    ente_conservazione: "Museo Civico Castello Ursino",
  },
  {
    id: 103,
    segnatura: "ASD-1640-F09",
    fondo: "Archivio Storico Diocesano — Cappella e Culto Agatino",
    titolo: "Libro di Fabbrica per gli altari e le tele seicentesche",
    datazione: "1638–1642",
    estratto_verificato:
      "Corrisposti ducati sessanta al pittore per il completamento della tela raffigurante la fermezza della martire Agata, destinata alla devozione cittadina nella chiesa madre.",
    immagine_url: null,
    ente_conservazione: "Museo Diocesano di Catania",
  },
  {
    id: 104,
    segnatura: "MCB-1831-M02",
    fondo: "Fondo Autografi Belliniani — Carteggi e Abbozzi",
    titolo: "Foglio di lavoro per il recitativo e la cavatina di Norma",
    datazione: "Autunno 1831",
    estratto_verificato:
      "Numerose correzioni a inchiostro bruno sulla linea del canto di 'Casta Diva', con annotazioni autografe sul respiro orchestrale e sull'equilibrio tra coro e soprano.",
    immagine_url: "/images/partitura-norma.svg",
    ente_conservazione: "Museo Civico Belliniano",
  },
];

function findEnte(id: number): EnteOut {
  const found = MOCK_ENTI.find((ente) => ente.id === id);
  if (!found) throw new Error(`Mock Ente ${id} non trovato`);
  return found;
}

function findDocumento(id: number): DocumentoArchivioOut {
  const found = MOCK_DOCUMENTI.find((doc) => doc.id === id);
  if (!found) throw new Error(`Mock Documento ${id} non trovato`);
  return found;
}

export const MOCK_OPERE: readonly OperaDetailOut[] = [
  {
    id: 1,
    qr_code: "COG-001",
    titolo: "Castello Ursino — Portale Svevo",
    autore: "Riccardo da Lentini",
    anno: "1239-1250",
    categoria: "monumento",
    sala: "Corte Interna",
    breve_sintesi:
      "Fortezza federiciana costruita su un promontorio lavico e sopravvissuta all'eruzione del 1669.",
    descrizione_ufficiale:
      "Voluto dall'imperatore Federico II di Svevia e progettato dall'architetto militare Riccardo da Lentini tra il 1239 e il 1250, il Castello Ursino presenta una rigorosa pianta quadrata con quattro torri angolari e un portale d'accesso sormontato dal rilievo dell'aquila imperiale. Originariamente lambito dal mare, fu circondato dalla colata lavica dell'Etna del 1669 che ne colmò il fossato e spostò la linea di costa, lasciando però intatta la struttura medievale.",
    immagine_url: "/images/castello-ursino.svg",
    ente_id: 1,
    ente_nome: findEnte(1).nome,
    citta: "Catania",
    lat: 37.4989,
    lng: 15.0846,
    has_archivio: true,
    ente: findEnte(1),
    documento_archivio: findDocumento(101),
  },
  {
    id: 2,
    qr_code: "COG-002",
    titolo: "Torso di Imperatore Romano",
    autore: "Bottega imperiale romana",
    anno: "II sec. d.C.",
    categoria: "reperto",
    sala: "Sala I — Lapidario e Scultura Antica",
    breve_sintesi:
      "Scultura loricata in marmo bianco proveniente dagli scavi settecenteschi del Principe di Biscari.",
    descrizione_ufficiale:
      "Il torso acefalo in marmo lunense raffigura un sovrano romano con corazza anatomica (lorica musculata) impreziosita dal gorgoneion centrale e dal paludamento militare raccolto sulla spalla sinistra. Rinvenuto nel XVIII secolo durante le campagne di scavo promosse da Ignazio Paternò Castello, principe di Biscari, testimonia il prestigio della Catania imperiale tra l'età adrianea e antonina.",
    immagine_url: "/images/torso-imperatore.svg",
    ente_id: 1,
    ente_nome: findEnte(1).nome,
    citta: "Catania",
    lat: 37.4992,
    lng: 15.0842,
    has_archivio: true,
    ente: findEnte(1),
    documento_archivio: findDocumento(102),
  },
  {
    id: 3,
    qr_code: "COG-003",
    titolo: "Martirio di Sant'Agata",
    autore: "Cerchia di Giovanni Lanfranco",
    anno: "1635 ca.",
    categoria: "opera",
    sala: "Pinacoteca — Sala del Seicento",
    breve_sintesi:
      "Tela chiaroscurale seicentesca legata alla devozione cittadina e ai registri diocesani.",
    descrizione_ufficiale:
      "Dipinto a olio su tela di intenso impianto teatrale barocco, caratterizzato da una diagonale di luce calda che isola la figura della santa avvolta nel manto cremisi. L'opera riflette l'adesione della committenza ecclesiastica catanese ai modelli emiliano-romani del primo Seicento e documenta la centralità del culto agatino nei decenni precedenti al terremoto del 1693.",
    immagine_url: "/images/martirio-sant-agata.svg",
    ente_id: 3,
    ente_nome: findEnte(3).nome,
    citta: "Catania",
    lat: 37.5023,
    lng: 15.0878,
    has_archivio: true,
    ente: findEnte(3),
    documento_archivio: findDocumento(103),
  },
  {
    id: 4,
    qr_code: "COG-004",
    titolo: "Pianta della colata lavica del 1669",
    autore: "Anonimo cartografo",
    anno: "1669",
    categoria: "documento",
    sala: "Archivio Storico — Fondo Mappe",
    breve_sintesi:
      "Rappresentazione storica dell'avanzata della lava etnea attorno alle mura e al Castello Ursino.",
    descrizione_ufficiale:
      "Carta topografica manoscritta a inchiostro e acquerello che registra con precisione il fronte lavico sceso dai Monti Rossi nel marzo-giugno 1669. Il tracciato illustra l'impatto contro la cinta bastionata occidentale e il celebre aggiramento del Castello Ursino, costituendo una fonte primaria indispensabile per comprendere la trasformazione urbanistica della città.",
    immagine_url: "/images/pianta-1669.svg",
    ente_id: 2,
    ente_nome: findEnte(2).nome,
    citta: "Catania",
    lat: 37.5034,
    lng: 15.0867,
    has_archivio: true,
    ente: findEnte(2),
    documento_archivio: findDocumento(101),
  },
  {
    id: 5,
    qr_code: "COG-005",
    titolo: "Anfiteatro Romano di Piazza Stesicoro",
    autore: "Architettura imperiale romana",
    anno: "II sec. d.C.",
    categoria: "monumento",
    sala: "Area ipogea a cielo aperto",
    breve_sintesi:
      "Imponente monumento in pietra lavica e marmo parzialmente riemerso sotto la piazza moderna.",
    descrizione_ufficiale:
      "Edificato nel II secolo d.C. sul declivio settentrionale della città antica, l'Anfiteatro Romano di Catania sfruttava il contrasto cromatico tra la pietra lavica dell'Etna e i rivestimenti in marmo chiaro. Capace di ospitare fino a quindicimila spettatori, rimase inglobato nei rifacimenti medievali e nella ricostruzione post-1693 prima degli scavi di inizio Novecento.",
    immagine_url: "/images/anfiteatro-romano.svg",
    ente_id: 4,
    ente_nome: findEnte(4).nome,
    citta: "Catania",
    lat: 37.5074,
    lng: 15.0853,
    has_archivio: false,
    ente: findEnte(4),
    documento_archivio: null,
  },
  {
    id: 6,
    qr_code: "COG-006",
    titolo: "Partitura autografa di Norma (Foglio di studio)",
    autore: "Vincenzo Bellini",
    anno: "1831",
    categoria: "documento",
    sala: "Sala degli Autografi",
    breve_sintesi:
      "Foglio musicale con correzioni autografe del compositore catanese per la cavatina 'Casta Diva'.",
    descrizione_ufficiale:
      "Bifolio manoscritto su carta pentagrammata di formato oblungo conservato nella casa natale del compositore. Le cancellature a inchiostro ferrogallico mostrano la ricerca melodica di Vincenzo Bellini nel limare le inflessioni vocali di Norma, offrendo uno sguardo diretto sul processo creativo prima della prima scaligera del dicembre 1831.",
    immagine_url: "/images/partitura-norma.svg",
    ente_id: 5,
    ente_nome: findEnte(5).nome,
    citta: "Catania",
    lat: 37.5019,
    lng: 15.0836,
    has_archivio: true,
    ente: findEnte(5),
    documento_archivio: findDocumento(104),
  },
  {
    id: 7,
    qr_code: "COG-007",
    titolo: "Chiostro di Levante — Monastero dei Benedettini",
    autore: "Giovan Battista Vaccarini e maestranze",
    anno: "1702-1750",
    categoria: "monumento",
    sala: "Ala Orientale — Chiostro del Settecento",
    breve_sintesi:
      "Monumentale corte porticata del tardo barocco siciliano edificata sopra antiche colate laviche.",
    descrizione_ufficiale:
      "Parte integrante di uno dei più vasti complessi monastici d'Europa, il Chiostro di Levante unisce la solennità delle arcate su colonne binate al gusto decorativo del Settecento catanese. L'intero edificio testimonia la resilienza costruttiva della città, capace di integrare la colata del 1669 e il sisma del 1693 in una nuova architettura civile e culturale.",
    immagine_url: "/images/monastero-benedettini.svg",
    ente_id: 6,
    ente_nome: findEnte(6).nome,
    citta: "Catania",
    lat: 37.5037,
    lng: 15.0799,
    has_archivio: false,
    ente: findEnte(6),
    documento_archivio: null,
  },
];

export function toOperaSummary(opera: OperaDetailOut): OperaSummaryOut {
  return {
    id: opera.id,
    qr_code: opera.qr_code,
    titolo: opera.titolo,
    autore: opera.autore,
    anno: opera.anno,
    categoria: opera.categoria,
    sala: opera.sala,
    breve_sintesi: opera.breve_sintesi,
    immagine_url: opera.immagine_url,
    ente_id: opera.ente_id,
    ente_nome: opera.ente_nome,
    citta: opera.citta,
    lat: opera.lat,
    lng: opera.lng,
    has_archivio: opera.has_archivio,
  };
}

export const MOCK_NARRAZIONI: Record<number, Record<LivelloCompetenza, NarrazioneOut>> = {
  1: {
    bambino: {
      opera_id: 1,
      livello: "bambino",
      testo_lettura:
        "Immagina un castello costruito proprio in riva al mare quasi ottocento anni fa. Un giorno, nel 1669, un fiume rosso di lava scese dall'Etna e abbracciò le sue mura senza riuscire a distruggerlo: ecco perché oggi il castello non tocca più l'acqua, ma custodisce ancora il suo antico portale con l'aquila!",
      script_audio:
        "Immagina un castello costruito proprio in riva al mare quasi ottocento anni fa. Nel milleseicentosessantanove un fiume di lava scese dall'Etna e circondò le sue mura senza riuscire a distruggerlo. Così il mare si allontanò, ma il portale con l'aquila è ancora qui.",
      curiosita: "Sapevi che un tempo le onde del mare arrivavano fin sotto le finestre di questo castello?",
      fonti_citate: ["Museo Civico Castello Ursino", "Archivio Storico Comunale — ASC-1669-B14"],
      from_cache: true,
    },
    ragazzo: {
      opera_id: 1,
      livello: "ragazzo",
      testo_lettura:
        "Il Castello Ursino nacque nel Duecento come fortezza militare voluta da Federico II di Svevia per controllare la costa orientale della Sicilia. La sua geometria quadrata con quattro grandi torri ha resistito a terremoti e soprattutto all'eruzione del 1669, quando la lava riempì il fossato cambiando per sempre la mappa di Catania.",
      script_audio:
        "Il Castello Ursino nacque nel Duecento come fortezza voluta da Federico secondo di Svevia per controllare la costa. La sua pianta quadrata ha resistito a terremoti e alla colata lavica del milleseicentosessantanove, che riempì il fossato e spostò la linea del mare.",
      curiosita: "Osservando la base delle torri puoi notare come la quota del terreno intorno al castello sia salita di diversi metri dopo la colata.",
      fonti_citate: ["Museo Civico Castello Ursino", "Fondo Senato Cittadino — 1669"],
      from_cache: true,
    },
    adulto: {
      opera_id: 1,
      livello: "adulto",
      testo_lettura:
        "Progettato da Riccardo da Lentini tra il 1239 e il 1250 per Federico II, il Castello Ursino rappresenta uno degli esempi più limpidi di architettura castrale sveva. Il portale d'ingresso conserva il simbolo dell'aquila imperiale, mentre i registri dell'Archivio Storico Comunale raccontano come la colata del 1669 lambì i bastioni meridionali trasformando una fortezza marittima in presidio urbano.",
      script_audio:
        "Progettato da Riccardo da Lentini tra il milleduecentotrentanove e il milleduecentocinquanta per Federico secondo, il Castello Ursino è un capolavoro dell'architettura sveva. I registri dell'Archivio Storico Comunale documentano come la colata del milleseicentosessantanove circondò i bastioni trasformando una fortezza sul mare in cuore urbano.",
      curiosita: "Nel Settecento e nell'Ottocento il castello accolse anche la collezione di antichità civiche, diventando museo pubblico nel 1934.",
      fonti_citate: ["Museo Civico Castello Ursino", "Archivio Storico Comunale — ASC-1669-B14"],
      from_cache: true,
    },
    esperto: {
      opera_id: 1,
      livello: "esperto",
      testo_lettura:
        "L'impianto quadrangolare del Castellum Ursini (1239–1250), attribuito al praepositus aedificiorum Riccardo da Lentini, articola un corte centrale e ali voltate a crociera impostate su torri cilindriche angolari. Il confronto incrociato con la fonte archivistica ASC-1669-B14 del Fondo Senato Cittadino attesta il parziale interramento del fossato nel 1669 e la sopravvivenza del fornice ogivale svevo e della scultura aquilifera.",
      script_audio:
        "L'impianto quadrangolare del Castello Ursino, attribuito a Riccardo da Lentini tra il milleduecentotrentanove e il milleduecentocinquanta, unisce corte centrale, volte a crociera e torri cilindriche angolari. Il documento d'archivio del Fondo Senato Cittadino attesta l'interramento parziale del fossato nel milleseicentosessantanove.",
      curiosita: "L'iconografia dell'aquila che ghermisce la preda sopra l'architrave ribadisce il programma politico federiciano di sovranità sul territorio siciliano.",
      fonti_citate: ["Archivio Storico Comunale — Segnatura ASC-1669-B14", "Scheda catalografica Castello Ursino"],
      from_cache: true,
    },
  },
  2: {
    bambino: {
      opera_id: 2,
      livello: "bambino",
      testo_lettura:
        "Questa statua di marmo bianco mostra l'armatura di un antico imperatore romano. Manca la testa perché il tempo l'ha portata via, ma sulla corazza si vedono ancora tutti i muscoli scolpiti e un mantello piegato sulla spalla, proprio come nei film sui gladiatori!",
      script_audio:
        "Questa statua di marmo bianco mostra l'armatura di un antico imperatore romano. Anche senza la testa, sulla corazza si riconoscono i muscoli scolpiti e il mantello da comandante appoggiato sulla spalla.",
      curiosita: "Molti artisti di duemila anni fa dipingevano le statue di marmo con colori vivaci come il rosso e l'oro.",
      fonti_citate: ["Museo Civico Castello Ursino", "Fondo Biscari — SBB-1780-C04"],
      from_cache: true,
    },
    ragazzo: {
      opera_id: 2,
      livello: "ragazzo",
      testo_lettura:
        "Il torso appartiene a una statua celebrativa di età romana imperiale ritrovata a Catania nel Settecento. L'armatura anatomica con al centro il volto di Medusa serviva a trasmettere forza e protezione, ricordando ai cittadini il potere di Roma anche negli edifici pubblici dell'antica Catina.",
      script_audio:
        "Questo torso appartiene a una statua onoraria romana ritrovata a Catania nel Settecento. L'armatura scolpita con il volto di Medusa al centro serviva a comunicare autorevolezza negli spazi pubblici dell'antica città.",
      curiosita: "Il principe di Biscari conservò questo reperto nel suo palazzo prima che confluisse nelle collezioni del Castello Ursino.",
      fonti_citate: ["Museo Civico Castello Ursino", "Fondo Biscari — 1780"],
      from_cache: true,
    },
    adulto: {
      opera_id: 2,
      livello: "adulto",
      testo_lettura:
        "Databile al II secolo d.C., il torso loricato testimonia la ricchezza dell'apparato scultoreo che ornava i complessi monumentali della Catania romana. Un inventario settecentesco del Fondo Biscari documenta l'estrazione del marmo dalle strutture del teatro antico e il suo ingresso nella prima raccolta archeologica cittadina.",
      script_audio:
        "Databile al secondo secolo dopo Cristo, questo torso con corazza testimonia lo splendore scultoreo della Catania romana. Un inventario settecentesco del Fondo Biscari documenta il suo recupero tra le murature dell'antico teatro.",
      curiosita: "L'assenza della testa era talvolta legata al riutilizzo della stessa statua cambiando il ritratto dell'imperatore in carica.",
      fonti_citate: ["Museo Civico Castello Ursino", "Fondo Biscari — SBB-1780-C04"],
      from_cache: true,
    },
    esperto: {
      opera_id: 2,
      livello: "esperto",
      testo_lettura:
        "Torso loricato in marmo lunense di officina imperiale (II sec. d.C.), connotato da lorica musculata con gorgoneion centrale e paludamentum drappeggiato sull'omero sinistro. La provenienza è corroborata dall'atto SBB-1780-C04 del Fondo Biscari (14 ottobre 1780), che registra il recupero del frammento dal settore occidentale del teatro romano catanese.",
      script_audio:
        "Torso con corazza anatomica in marmo lunense del secondo secolo dopo Cristo, caratterizzato dal medaglione centrale e dal mantello sull'omero sinistro. L'inventario del Fondo Biscari del quattordici ottobre millesettecentottanta ne attesta il recupero nel settore occidentale del teatro romano.",
      curiosita: "Il modellato morbido delle pieghe del paludamento suggerisce un inquadramento cronologico tra l'età di Adriano e i primi Antonini.",
      fonti_citate: ["Fondo Biscari — Segnatura SBB-1780-C04", "Lapidario Castello Ursino"],
      from_cache: true,
    },
  },
  3: {
    bambino: {
      opera_id: 3,
      livello: "bambino",
      testo_lettura:
        "In questo quadro buio c'è un raggio di luce dorata che illumina la santa patrona di Catania, Sant'Agata. Il pittore ha usato un mantello rosso acceso per attirare subito i nostri occhi e farci capire il suo coraggio.",
      script_audio:
        "In questo quadro un raggio di luce dorata illumina Sant'Agata, la patrona di Catania. Il pittore ha scelto un mantello rosso intenso per raccontare il suo grande coraggio.",
      curiosita: "Nel Museo Diocesano si conservano molti oggetti e libri antichi che raccontano le feste dedicate a Sant'Agata.",
      fonti_citate: ["Museo Diocesano di Catania", "Archivio Storico Diocesano — ASD-1640-F09"],
      from_cache: true,
    },
    ragazzo: {
      opera_id: 3,
      livello: "ragazzo",
      testo_lettura:
        "Dipinta intorno al 1635, questa tela usa forti contrasti tra ombre profonde e luce teatrale, una tecnica tipica del Seicento barocco. Il rosso del drappeggio e la diagonale luminosa guidano lo sguardo dello spettatore come in una scena cinematografica.",
      script_audio:
        "Dipinta intorno al milleseicentotrentacinque, questa tela utilizza i forti contrasti di luce e ombra tipici del Seicento barocco. La diagonale luminosa guida subito l'occhio sulla figura centrale.",
      curiosita: "Un registro dei pagamenti del 1640 rivela perfino quanto venne pagato l'artista in ducati per completare l'opera.",
      fonti_citate: ["Museo Diocesano di Catania", "Archivio Storico Diocesano"],
      from_cache: true,
    },
    adulto: {
      opera_id: 3,
      livello: "adulto",
      testo_lettura:
        "Realizzata nell'orbita della pittura barocca di tradizione romano-emiliana, la tela esprime il forte legame identitario di Catania con Sant'Agata nel XVII secolo. Il Libro di Fabbrica conservato nell'Archivio Storico Diocesano permette di seguire la committenza ecclesiastica che precedette la grande ricostruzione post-terremoto.",
      script_audio:
        "Realizzata nel Seicento entro la tradizione pittorica barocca, la tela esprime il profondo legame tra Catania e la sua patrona. Il Libro di Fabbrica dell'Archivio Diocesano documenta le spese e la committenza religiosa di quegli anni.",
      curiosita: "Le fonti diocesane del Seicento sono tra le poche testimonianze dirette dell'arte sacra catanese sopravvissute al sisma del 1693.",
      fonti_citate: ["Museo Diocesano di Catania", "Archivio Storico Diocesano — ASD-1640-F09"],
      from_cache: true,
    },
    esperto: {
      opera_id: 3,
      livello: "esperto",
      testo_lettura:
        "Olio su tela ascritto alla cerchia di Giovanni Lanfranco (1635 ca.), contraddistinto da impianto luministico diagonale e densa stesura del cinabro nel manto. Il documento ASD-1640-F09 del Fondo Cappella e Culto Agatino attesta l'erogazione di sessanta ducati tra il 1638 e il 1642 per il corredo pittorico devozionale.",
      script_audio:
        "Olio su tela della cerchia di Giovanni Lanfranco, databile intorno al milleseicentotrentacinque, con impianto luministico diagonale. Il registro d'archivio della Cappella e Culto Agatino documenta un pagamento di sessanta ducati tra il milleseicentotrentotto e il milleseicentoquarantadue.",
      curiosita: "La scansione compositiva dialoga con le coeve pale d'altare meridionali influenzate dal classicismo barocco romano.",
      fonti_citate: ["Archivio Storico Diocesano — Segnatura ASD-1640-F09", "Museo Diocesano"],
      from_cache: true,
    },
  },
  4: {
    bambino: {
      opera_id: 4,
      livello: "bambino",
      testo_lettura:
        "Questa sembra una mappa del tesoro, ma in realtà racconta una grande avventura vera! Disegnata nel 1669, mostra la striscia di lava che scende dall'Etna e si ferma proprio attorno alle mura di Catania e al Castello Ursino.",
      script_audio:
        "Questa antica mappa racconta una storia vera del milleseicentosessantanove. Mostra il percorso della lava che scende dall'Etna e si divide attorno alle mura della città e al Castello Ursino.",
      curiosita: "Sulla mappa puoi vedere la rosa dei venti che indica il Nord, proprio come nelle carte dei navigatori.",
      fonti_citate: ["Archivio Storico Comunale — ASC-1669-B14"],
      from_cache: true,
    },
    ragazzo: {
      opera_id: 4,
      livello: "ragazzo",
      testo_lettura:
        "Nel 1669 un disegnatore tracciò a inchiostro e acquerello la traiettoria esatta della lava che minacciava Catania. Grazie a mappe come questa oggi possiamo confrontare la città attuale con quella del Seicento e capire dove correva l'antica linea costiera.",
      script_audio:
        "Nel milleseicentosessantanove un cartografo disegnò a inchiostro il fronte della lava alle porte di Catania. Confrontando questa mappa con la città di oggi è possibile ricostruire dove passava l'antica costa.",
      curiosita: "I catanesi cercarono persino di deviare il corso della lava con delle barriere vicino ai paesi etnei: fu uno dei primi tentativi al mondo.",
      fonti_citate: ["Archivio Storico Comunale di Catania"],
      from_cache: true,
    },
    adulto: {
      opera_id: 4,
      livello: "adulto",
      testo_lettura:
        "Conservata nell'Archivio Storico Comunale, questa pianta manoscritta del 1669 documenta con straordinaria chiarezza l'avanzata del fronte lavico fino al porto e al Castello Ursino. Insieme alle delibere del Senato Cittadino, spiega perché alcuni quartieri e monumenti sopravvissero modificando per sempre il profilo urbano.",
      script_audio:
        "Conservata nell'Archivio Storico Comunale, questa pianta manoscritta del milleseicentosessantanove documenta l'arrivo della lava fino al porto e al Castello Ursino. È una testimonianza preziosa per capire la trasformazione della città.",
      curiosita: "La colata del 1669 avanzò per oltre quattro mesi creando nuovi promontori rocciosi sul mar Ionio.",
      fonti_citate: ["Archivio Storico Comunale — Segnatura ASC-1669-B14"],
      from_cache: true,
    },
    esperto: {
      opera_id: 4,
      livello: "esperto",
      testo_lettura:
        "Documento cartografico manoscritto ad inchiostro bruno e acquerello (1669), pertinente al Fondo Mappe dell'Archivio Storico Comunale di Catania. Integrato con il fascicolo ASC-1669-B14 del Senato Cittadino, costituisce fonte primaria per l'analisi geomorfologica e topografica dell'impatto sui bastioni occidentali e sul Castellum Ursini.",
      script_audio:
        "Documento cartografico manoscritto del milleseicentosessantanove conservato nel Fondo Mappe dell'Archivio Storico Comunale. Insieme al fascicolo del Senato Cittadino, offre dati essenziali sull'impatto topografico contro i bastioni e il Castello Ursino.",
      curiosita: "La toponomastica marginale registra porte urbiche e conventi poi sommersi o ricostruiti in altra sede dopo il 1693.",
      fonti_citate: ["Archivio Storico Comunale — Segnatura ASC-1669-B14", "Fondo Mappe 1669"],
      from_cache: true,
    },
  },
  5: {
    bambino: {
      opera_id: 5,
      livello: "bambino",
      testo_lettura:
        "Proprio sotto la piazza più affollata del centro si nasconde un antico stadio romano! Qui, quasi duemila anni fa, migliaia di persone si sedevano sulle gradinate costruite con la pietra nera dell'Etna per guardare grandi spettacoli.",
      script_audio:
        "Sotto questa piazza del centro si nasconde un antico stadio romano. Quasi duemila anni fa migliaia di spettatori si sedevano sulle gradinate costruite con la pietra nera dell'Etna.",
      curiosita: "Quello che vedi oggi è solo una piccola parte: il resto dell'arena continua ancora sotto i palazzi vicini!",
      fonti_citate: ["Parco Archeologico Greco-Romano di Catania"],
      from_cache: true,
    },
    ragazzo: {
      opera_id: 5,
      livello: "ragazzo",
      testo_lettura:
        "Costruito nel II secolo dopo Cristo, l'Anfiteatro Romano di Catania era grande quasi quanto quelli delle maggiori città dell'Impero. Il contrasto tra blocchi di basalto lavico scuro e marmo bianco lo rendeva unico nel suo genere.",
      script_audio:
        "Costruito nel secondo secolo dopo Cristo, l'Anfiteatro Romano di Catania poteva ospitare migliaia di spettatori. L'alternanza tra pietra lavica scura e marmo bianco gli dava un aspetto inconfondibile.",
      curiosita: "Per secoli le pietre dell'anfiteatro vennero riutilizzate per costruire le nuove case dopo i terremoti.",
      fonti_citate: ["Parco Archeologico Greco-Romano di Catania"],
      from_cache: true,
    },
    adulto: {
      opera_id: 5,
      livello: "adulto",
      testo_lettura:
        "Situato ai margini dell'antico abitato in Piazza Stesicoro, l'Anfiteatro Romano del II secolo d.C. testimonia l'importanza economica e politica di Catania in età imperiale. Pur privo di un unico documento d'archivio diretto collegato, il monumento dialoga con le sculture e i reperti estratti nel Settecento dagli altri complessi cittadini.",
      script_audio:
        "Situato in Piazza Stesicoro, l'Anfiteatro Romano del secondo secolo dopo Cristo dimostra l'importanza di Catania in età imperiale. Le sue arcate in basalto lavico dialogano con i reperti provenienti dagli altri monumenti antichi della città.",
      curiosita: "Gli scavi archeologici dell'inizio del Novecento riportarono alla luce il settore settentrionale della cavea, fino ad allora sotterraneo.",
      fonti_citate: ["Parco Archeologico Greco-Romano di Catania"],
      from_cache: true,
    },
    esperto: {
      opera_id: 5,
      livello: "esperto",
      testo_lettura:
        "Struttura ellittica in opus caementicium e paramento in blocchi di basalto etneo con partiture marmoree (II sec. d.C., asse maggiore stimato intorno a 125 metri). L'assenza di un fondo archivistico coevo impone una lettura stratigrafica diretta delle volte radiali e dei vomitoria superstiti.",
      script_audio:
        "Struttura ellittica del secondo secolo dopo Cristo con paramento in basalto etneo e inserti marmorei. La lettura stratigrafica diretta delle volte radiali permette di ricostruire l'alzato originario anche in assenza di documenti d'archivio diretti.",
      curiosita: "Il sistema delle gallerie ipogee rivela un sapiente sfruttamento del pendio naturale della collina di Montevergine.",
      fonti_citate: ["Parco Archeologico Greco-Romano — Scheda Monumentale"],
      from_cache: true,
    },
  },
  6: {
    bambino: {
      opera_id: 6,
      livello: "bambino",
      testo_lettura:
        "Su questo foglio antico il musicista catanese Vincenzo Bellini ha scritto a mano le note della sua opera più famosa, Norma. Se guardi bene vedrai piccole cancellature: anche i grandi compositori provano e riprovano finché la melodia diventa perfetta!",
      script_audio:
        "Su questo foglio antico Vincenzo Bellini ha scritto a mano le note della sua opera Norma. Le piccole cancellature mostrano come il compositore provasse più volte una melodia prima di trovare quella perfetta.",
      curiosita: "L'aria più celebre di questa partitura si chiama Casta Diva ed è famosa nei teatri di tutto il mondo.",
      fonti_citate: ["Museo Civico Belliniano", "Fondo Autografi — MCB-1831-M02"],
      from_cache: true,
    },
    ragazzo: {
      opera_id: 6,
      livello: "ragazzo",
      testo_lettura:
        "Questo manoscritto del 1831 mostra il dietro le quinte del lavoro di Vincenzo Bellini sulla partitura di Norma. Tra cancellature a inchiostro e annotazioni rapide si capisce come nacque una delle melodie più celebri della storia dell'opera lirica.",
      script_audio:
        "Questo manoscritto del milleottocentotrentuno rivela il lavoro creativo di Vincenzo Bellini su Norma. Tra correzioni a inchiostro e appunti di scena si segue la nascita di una melodia celebre in tutto il mondo.",
      curiosita: "Bellini riscrisse più volte la melodia di Casta Diva prima del debutto al Teatro alla Scala di Milano.",
      fonti_citate: ["Museo Civico Belliniano", "Fondo Autografi Belliniani"],
      from_cache: true,
    },
    adulto: {
      opera_id: 6,
      livello: "adulto",
      testo_lettura:
        "Conservato nella casa natale del compositore, il foglio di studio del 1831 documenta la genesi di Norma e in particolare dell'aria Casta Diva. Le varianti autografe custodite nel Fondo Autografi Belliniani rivelano l'attenzione maniacale di Bellini per la cantabilità e la fusione tra voce solista e coro.",
      script_audio:
        "Conservato nel Museo Civico Belliniano, questo foglio di studio del milleottocentotrentuno documenta la nascita dell'aria Casta Diva. Le correzioni autografe rivelano la cura di Bellini per il canto e per il dialogo con il coro.",
      curiosita: "La prima rappresentazione di Norma ebbe un esordio difficile a Milano, prima di diventare uno dei capolavori assoluti del melodramma.",
      fonti_citate: ["Museo Civico Belliniano", "Fondo Autografi — MCB-1831-M02"],
      from_cache: true,
    },
    esperto: {
      opera_id: 6,
      livello: "esperto",
      testo_lettura:
        "Bifolio oblungo pentagrammato (autunno 1831, segnatura MCB-1831-M02), vergato a inchiostro ferrogallico con interventi correttivi sulla linea melodica e sull'accompagnamento orchestrale di Norma. La collazione con gli abbozzi precedenti chiarisce la progressiva depurazione dell'ornamentazione vocale verso la cantabilità lirica del primo atto.",
      script_audio:
        "Foglio musicale autografo dell'autunno milleottocentotrentuno conservato nel Fondo Autografi Belliniani. Le correzioni a inchiostro mostrano la progressiva ricerca di purezza melodica nella stesura di Norma.",
      curiosita: "Le note marginali consentono di seguire il dialogo diretto con il librettista Felice Romani.",
      fonti_citate: ["Museo Civico Belliniano — Segnatura MCB-1831-M02", "Fondo Autografi 1831"],
      from_cache: true,
    },
  },
  7: {
    bambino: {
      opera_id: 7,
      livello: "bambino",
      testo_lettura:
        "Questo grande cortile pieno di archi eleganti fa parte di un monastero enorme, costruito sopra le rocce scure lasciate dalla lava del 1669. Oggi tra queste colonne non passeggiano più i monaci, ma gli studenti dell'università!",
      script_audio:
        "Questo grande cortile pieno di archi fa parte di un monastero costruito sopra le rocce della lava del milleseicentosessantanove. Oggi tra queste colonne passeggiano gli studenti dell'università.",
      curiosita: "Il giardino e i corridoi del monastero sono così grandi da formare quasi una piccola città nella città.",
      fonti_citate: ["Monastero dei Benedettini di San Nicolò l'Arena"],
      from_cache: true,
    },
    ragazzo: {
      opera_id: 7,
      livello: "ragazzo",
      testo_lettura:
        "Il Chiostro di Levante del Monastero dei Benedettini è un simbolo della rinascita di Catania dopo l'eruzione del 1669 e il terremoto del 1693. Le sue eleganti arcate settecentesche oggi ospitano aule universitarie e visite guidate tra rovine antiche e pietra lavica.",
      script_audio:
        "Il Chiostro di Levante del Monastero dei Benedettini è un simbolo della rinascita di Catania nel Settecento. Oggi le sue arcate ospitano l'università e mostrano il passaggio dalla lava antica al barocco.",
      curiosita: "Scendendo nei sotterranei del monastero si possono ancora vedere gli ambienti costruiti prima della colata del 1669.",
      fonti_citate: ["Monastero dei Benedettini di San Nicolò l'Arena"],
      from_cache: true,
    },
    adulto: {
      opera_id: 7,
      livello: "adulto",
      testo_lettura:
        "Edificato nel Settecento dopo la duplice catastrofe dell'eruzione del 1669 e del sisma del 1693, il Chiostro di Levante esprime la monumentalità del tardo barocco catanese. Il complesso sorge letteralmente sul banco lavico solidificato e integra tracce romane, rinascimentali e settecentesche in un unico palinsesto urbano.",
      script_audio:
        "Edificato nel Settecento dopo l'eruzione del milleseicentosessantanove e il terremoto del milleseicentonovantatré, il Chiostro di Levante incarna il tardo barocco catanese. L'edificio sorge sopra la colata lavica e unisce strati di epoche diverse.",
      curiosita: "L'edificio è riconosciuto dall'UNESCO insieme al centro tardo barocco del Val di Noto.",
      fonti_citate: ["Monastero dei Benedettini di San Nicolò l'Arena"],
      from_cache: true,
    },
    esperto: {
      opera_id: 7,
      livello: "esperto",
      testo_lettura:
        "Corte porticata del complesso di San Nicolò l'Arena (1702–1750), riconfigurata dal contributo progettuale di Giovan Battista Vaccarini su precedenti fabbriche cinquecentesche investite dal fronte lavico del 1669. La partitura binata delle colonne in pietra calcarea dialoga cromaticamente con i basamenti in basalto etneo.",
      script_audio:
        "Corte porticata settecentesca di San Nicolò l'Arena, progettata anche con il contributo di Giovan Battista Vaccarini sopra le preesistenze investite dalla lava nel milleseicentosessantanove. L'alternanza tra calcare chiaro e basalto scuro caratterizza l'intero chiostro.",
      curiosita: "Il progetto di recupero contemporaneo di Giancarlo De Carlo ha valorizzato la leggibilità delle stratificazioni storiche.",
      fonti_citate: ["Complesso Benedettino — Scheda Storico-Architettonica"],
      from_cache: true,
    },
  },
};

function summaryById(id: number): OperaSummaryOut {
  const found = MOCK_OPERE.find((opera) => opera.id === id);
  if (!found) throw new Error(`Mock Opera ${id} non trovata`);
  return toOperaSummary(found);
}

export const MOCK_CORRELAZIONI: Record<number, CorrelazioneItemOut[]> = {
  1: [
    {
      tipo_relazione: "evento_storico",
      motivazione:
        "La pianta d'archivio del 1669 documenta esattamente il percorso della colata lavica che circondò le mura del Castello Ursino.",
      opera: summaryById(4),
    },
    {
      tipo_relazione: "collezione_museale",
      motivazione:
        "Il torso imperiale del Fondo Biscari è conservato nelle sale interne dello stesso Castello Ursino.",
      opera: summaryById(2),
    },
    {
      tipo_relazione: "territorio",
      motivazione:
        "Entrambi i complessi testimoniano l'impatto materiale e urbanistico dell'eruzione etnea del 1669 su Catania.",
      opera: summaryById(7),
    },
  ],
  2: [
    {
      tipo_relazione: "stesso_periodo",
      motivazione:
        "Il torso e l'Anfiteatro di Piazza Stesicoro appartengono entrambi al programma monumentale della Catania romana del II secolo d.C.",
      opera: summaryById(5),
    },
    {
      tipo_relazione: "sede_espositiva",
      motivazione:
        "La scultura è oggi custodita all'interno del percorso museale del Castello Ursino.",
      opera: summaryById(1),
    },
  ],
  3: [
    {
      tipo_relazione: "territorio",
      motivazione:
        "L'iconografia della patrona di Catania si intreccia con la storia delle difese cittadine durante l'eruzione del 1669.",
      opera: summaryById(4),
    },
    {
      tipo_relazione: "stesso_centro_storico",
      motivazione:
        "A pochi passi dal Museo Diocesano, la casa natale di Bellini custodisce la memoria musicale della città.",
      opera: summaryById(6),
    },
    {
      tipo_relazione: "contesto_storico",
      motivazione:
        "Il patrimonio ecclesiastico seicentesco trova continuità nella grande rinascita benedettina del Settecento.",
      opera: summaryById(7),
    },
  ],
  4: [
    {
      tipo_relazione: "evento_storico",
      motivazione:
        "La mappa mostra la colata del 1669 nel punto esatto in cui lambì e preservò i bastioni del Castello Ursino.",
      opera: summaryById(1),
    },
    {
      tipo_relazione: "territorio",
      motivazione:
        "Anche l'area del Monastero dei Benedettini fu raggiunta dallo stesso fronte lavico prima della ricostruzione settecentesca.",
      opera: summaryById(7),
    },
    {
      tipo_relazione: "archivio_collegato",
      motivazione:
        "Le cronache cittadine coeve legano la memoria dell'eruzione alla protezione civica e religiosa di Sant'Agata.",
      opera: summaryById(3),
    },
  ],
  5: [
    {
      tipo_relazione: "stesso_periodo",
      motivazione:
        "Le architetture dell'Anfiteatro sono contemporanee alla statuaria imperiale rinvenuta nei cantieri romani della città.",
      opera: summaryById(2),
    },
    {
      tipo_relazione: "stratificazione_urbana",
      motivazione:
        "Come i bastioni del Castello Ursino, le rovine romane mostrano le trasformazioni del suolo urbano attraverso i secoli.",
      opera: summaryById(1),
    },
  ],
  6: [
    {
      tipo_relazione: "territorio",
      motivazione:
        "Il Museo Civico Belliniano dista poche centinaia di metri dal complesso del Monastero dei Benedettini nel cuore barocco.",
      opera: summaryById(7),
    },
    {
      tipo_relazione: "identita_culturale",
      motivazione:
        "L'eredità musicale belliniana dialoga con le collezioni civiche e la storia cittadina custodite al Castello Ursino.",
      opera: summaryById(1),
    },
    {
      tipo_relazione: "patrimonio_sacro_civico",
      motivazione:
        "La cultura liturgica e musicale catanese si riflette nelle collezioni del vicino Museo Diocesano.",
      opera: summaryById(3),
    },
  ],
  7: [
    {
      tipo_relazione: "evento_storico",
      motivazione:
        "La pianta del 1669 illustra la colata lavica su cui poggiano le fondazioni settecentesche del Monastero.",
      opera: summaryById(4),
    },
    {
      tipo_relazione: "territorio",
      motivazione:
        "Il complesso benedettino e il Castello Ursino segnano due poli chiave della trasformazione geologica e urbana di Catania.",
      opera: summaryById(1),
    },
    {
      tipo_relazione: "vicinanza_culturale",
      motivazione:
        "Nel raggio di pochi minuti a piedi si raggiunge Piazza San Francesco e l'archivio musicale del Museo Belliniano.",
      opera: summaryById(6),
    },
  ],
};
