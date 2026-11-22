import type {
  AskRequest,
  AskResponse,
  CategoriaOpera,
  CorrelazioneItemOut,
  CorrelazioniResponse,
  EnteOut,
  LivelloCompetenza,
  NarrazioneOut,
  NearbyResponse,
  OperaDetailOut,
  OperaListResponse,
  OperaNearbyOut,
  OperaSummaryOut,
} from "../types/api";
import { ApiError } from "./apiError";
import {
  SICILY_CURIOSITA_MAP,
  SICILY_ERA_MAP,
  SICILY_EXTRA_OPERE,
} from "./sicilyMockCatalog";

const CATANIA_LAT = 37.5079;
const CATANIA_LNG = 15.083;

const ENTI: Record<number, EnteOut> = {
  1: {
    id: 1,
    nome: "Museo Civico Castello Ursino",
    tipologia: "museo",
    indirizzo: "Piazza Federico di Svevia",
    citta: "Catania",
    lat: 37.499,
    lng: 15.0846,
    orari: "Mar–Dom 09:00–19:00 (ultimo ingresso 18:00)",
    sito_web: "https://www.comune.catania.it",
  },
  2: {
    id: 2,
    nome: "Archivio di Stato di Catania",
    tipologia: "archivio",
    indirizzo: "Via Vittorio Emanuele II, 156",
    citta: "Catania",
    lat: 37.5015,
    lng: 15.0841,
    orari: "Lun–Ven 08:30–13:30",
    sito_web: "https://archiviodistatocatania.cultura.gov.it",
  },
  3: {
    id: 3,
    nome: "Area Archeologica dell'Anfiteatro Romano",
    tipologia: "sito_territorio",
    indirizzo: "Piazza Stesicoro",
    citta: "Catania",
    lat: 37.5073,
    lng: 15.0858,
    orari: "Mar–Dom 09:00–17:30",
    sito_web: null,
  },
  4: {
    id: 4,
    nome: "Museo Civico Belliniano",
    tipologia: "museo",
    indirizzo: "Piazza San Francesco d'Assisi, 3",
    citta: "Catania",
    lat: 37.5023,
    lng: 15.0837,
    orari: "Lun–Sab 09:00–19:00 · Dom 09:00–13:00",
    sito_web: "https://www.comune.catania.it",
  },
  5: {
    id: 5,
    nome: "Monastero dei Benedettini di San Nicolò l'Arena",
    tipologia: "sito_territorio",
    indirizzo: "Piazza Dante Alighieri, 32",
    citta: "Catania",
    lat: 37.5037,
    lng: 15.0802,
    orari: "Tutti i giorni 09:00–17:00",
    sito_web: "https://www.monasterodeibenedettini.it",
  },
};

const BASE_CATANIA_OPERE: OperaDetailOut[] = [
  {
    id: 1,
    qr_code: "COG-001",
    titolo: "Portale Svevo di Riccardo da Lentini",
    autore: "Riccardo da Lentini",
    anno: "1239–1250",
    categoria: "monumento",
    sala: "Corte Federiciana – Ingresso Principale",
    breve_sintesi:
      "L'arco monumentale in pietra lavica e calcare bianco che accoglie i visitatori nel castello voluto da Federico II.",
    immagine_url: "/images/castello-ursino.svg",
    ente_id: 1,
    ente_nome: ENTI[1].nome,
    citta: "Catania",
    lat: 37.499,
    lng: 15.0846,
    has_archivio: true,
    descrizione_ufficiale:
      "Eretto tra il 1239 e il 1250 sotto la direzione del magister architectus Riccardo da Lentini su incarico dell'imperatore Federico II di Svevia, il portale d'ingresso del Castello Ursino presenta una raffinata ghiera ogivale a conci alternati di basalto lavico etneo e pietra calcarea bianca. Sormontato dalla nicchia con l'aquila imperiale che ghermisce una preda, il manufatto testimonia la transizione tra architettura normanna e rigore gotico-svevo e la resilienza della fortezza, originariamente affacciata sul mare prima della colata lavica del 1669.",
    ente: ENTI[1],
    documento_archivio: {
      id: 101,
      segnatura: "ASCt, Fondo Senato Civico, Reg. 14, fol. 42r",
      fondo: "Fondo Senato Civico di Catania",
      titolo: "Mandato di manutenzione delle torri e del portale reale",
      datazione: "15 maggio 1534",
      estratto_verificato:
        "Si ordina al maestro fabbricatore di consolidare li conci bianchi dell'arco maggiore del Castello Ursino sopra lo fossato reale, preservando l'insegna dell'Aquila Imperiale.",
      immagine_url: "/images/castello-ursino.svg",
      ente_conservazione: "Archivio di Stato di Catania",
    },
  },
  {
    id: 2,
    qr_code: "COG-002",
    titolo: "Martirio di Sant'Agata",
    autore: "Bottega di Filippo Paladini",
    anno: "ca. 1605",
    categoria: "opera",
    sala: "Sala IV – Pinacoteca Barocca",
    breve_sintesi:
      "Dipinto su tavola devozionale che narra la fermezza della patrona catanese tra chiaroscuro seicentesco e simboli civici.",
    immagine_url: "/images/martirio-sant-agata.svg",
    ente_id: 1,
    ente_nome: ENTI[1].nome,
    citta: "Catania",
    lat: 37.4991,
    lng: 15.0848,
    has_archivio: true,
    descrizione_ufficiale:
      "La tavola raffigura il martirio di Sant'Agata, patrona di Catania, secondo l'iconografia tardo-manierista diffusasi in Sicilia all'inizio del Seicento. L'impianto compositivo contrappone l'intenso chiaroscuro dei carnefici alla compostezza luminosa della santa, accompagnata dalla palma del martirio e dal velo purpureo invocato dalla città contro le eruzioni dell'Etna.",
    ente: ENTI[1],
    documento_archivio: {
      id: 102,
      segnatura: "ASCt, Notai Defunti, Vol. 218, c. 119v",
      fondo: "Fondo Notarile – Atti Capitolari",
      titolo: "Inventario della Cappella e commissione pittorica",
      datazione: "12 febbraio 1606",
      estratto_verificato:
        "Tavola grande dipinta ad olio sopra legno di noce raffigurante il glorioso martirio della Vergine Agata, collocata presso l'oratorio con cornice dorata a foglia.",
      immagine_url: "/images/martirio-sant-agata.svg",
      ente_conservazione: "Archivio di Stato di Catania",
    },
  },
  {
    id: 3,
    qr_code: "COG-003",
    titolo: "Torso Loricato dell'Imperatore Claudio",
    autore: "Scultore romano di età giulio-claudia",
    anno: "41–54 d.C.",
    categoria: "reperto",
    sala: "Sala II – Lapidario e Statuaria Romana",
    breve_sintesi:
      "Scultura in marmo lunense proveniente dal teatro cittadino con corazza decorata da Vittorie alate e Gorgoneion.",
    immagine_url: "/images/torso-imperatore.svg",
    ente_id: 1,
    ente_nome: ENTI[1].nome,
    citta: "Catania",
    lat: 37.4989,
    lng: 15.0844,
    has_archivio: false,
    descrizione_ufficiale:
      "Frammento statuario in marmo bianco lunense raffigurante un torace loricato attribuito all'imperatore Claudio o a un principe della dinastia giulio-claudia. La corazza anatomica reca al centro il Gorgoneion apotropaico sopra due Vittorie affrontate e una fascia inferiore a pteruges scolpiti con fine cesello, testimoniando il programma celebrativo pubblico della Catina romana imperiale.",
    ente: ENTI[1],
    documento_archivio: null,
  },
  {
    id: 4,
    qr_code: "COG-004",
    titolo: "Pianta dell'Eruzione dell'Etna del 1669",
    autore: "Anonimo ingegnere militare spagnolo",
    anno: "1669",
    categoria: "documento",
    sala: "Sala Consultazione Cartografica",
    breve_sintesi:
      "Rara carta acquerellata che documenta il braccio di lava dai Monti Rossi fino alle mura occidentali di Catania.",
    immagine_url: "/images/pianta-1669.svg",
    ente_id: 2,
    ente_nome: ENTI[2].nome,
    citta: "Catania",
    lat: 37.5015,
    lng: 15.0841,
    has_archivio: true,
    descrizione_ufficiale:
      "Carta topografica manoscritta su carta vergata acquerellata redatta nell'immediato seguito dell'eruzione dell'Etna del marzo-luglio 1669. Il rilievo descrive con precisione militare il percorso della colata lavica dai coni avventizi dei Monti Rossi presso Nicolosi fino al fronte che circondò il Castello Ursino, colmando l'antico porto e ridefinendo per sempre la linea di costa catanese.",
    ente: ENTI[2],
    documento_archivio: {
      id: 104,
      segnatura: "ASCt, Fondo Intendenza Borbonica, Cart. 7, tav. 2",
      fondo: "Fondo Topografico e Fortificazioni",
      titolo: "Relazione sul corso della lava dell'anno 1669 verso la Marina",
      datazione: "agosto 1669",
      estratto_verificato:
        "Il torrente di fuoco, superati li bastioni di San Giorgio, si riversò nel mare formando promontorio di pietra viva lungo trecento canne attorno al Castello.",
      immagine_url: "/images/pianta-1669.svg",
      ente_conservazione: "Archivio di Stato di Catania",
    },
  },
  {
    id: 5,
    qr_code: "COG-005",
    titolo: "Anfiteatro Romano di Catania",
    autore: "Maestranze romane imperiali",
    anno: "II secolo d.C.",
    categoria: "monumento",
    sala: null,
    breve_sintesi:
      "Imponente arena in pietra lavica e laterizio incastonata nel sottosuolo vivo di Piazza Stesicoro.",
    immagine_url: "/images/anfiteatro-romano.svg",
    ente_id: 3,
    ente_nome: ENTI[3].nome,
    citta: "Catania",
    lat: 37.5073,
    lng: 15.0858,
    has_archivio: false,
    descrizione_ufficiale:
      "Costruito nel II secolo d.C. e ampliato in età severiana, l'Anfiteatro Romano di Catania era tra i più vasti dell'Impero, capace di ospitare circa quindicimila spettatori su tre ordini di gradinate. Realizzato con blocchi squadrati di basalto lavico scuro e volte in opus caementicium, è oggi parzialmente visibile sotto il livello stradale di Piazza Stesicoro dopo essere stato utilizzato per secoli come cava di pietra per la ricostruzione della città.",
    ente: ENTI[3],
    documento_archivio: null,
  },
  {
    id: 6,
    qr_code: "COG-006",
    titolo: "Partitura Autografa della “Norma”",
    autore: "Vincenzo Bellini",
    anno: "1831",
    categoria: "documento",
    sala: "Sala III – I Grandi Melodrammi",
    breve_sintesi:
      "Fogli musicali e bozzetti melodici legati alla celebre cavatina Casta Diva del compositore catanese.",
    immagine_url: "/images/partitura-norma.svg",
    ente_id: 4,
    ente_nome: ENTI[4].nome,
    citta: "Catania",
    lat: 37.5023,
    lng: 15.0837,
    has_archivio: true,
    descrizione_ufficiale:
      "Prezioso testimone musicale conservato nella casa natale di Vincenzo Bellini in Piazza San Francesco d'Assisi. I fogli documentano la genesi della celebre cavatina 'Casta Diva' dall'atto primo della tragedia lirica Norma (1831), evidenziando le correzioni a inchiostro bruno apportate dal compositore per calibrare l'arco melodico belcantistico sul registro espressivo di Giuditta Pasta.",
    ente: ENTI[4],
    documento_archivio: {
      id: 106,
      segnatura: "MCB, Fondo Autografi Belliniani, Ms. B-1831/4",
      fondo: "Fondo Autografi e Cimeli Belliniani",
      titolo: "Abbozzo della Cavatina di Norma e lettere al librettista Romani",
      datazione: "ottobre–dicembre 1831",
      estratto_verificato:
        "Caro Romani, ho rielaborato otto volte la linea della preghiera alla luna affinché la voce scenda come rugiada limpida sopra l'orchestra.",
      immagine_url: "/images/partitura-norma.svg",
      ente_conservazione: "Museo Civico Belliniano",
    },
  },
  {
    id: 7,
    qr_code: "COG-007",
    titolo: "Chiostro del Monastero dei Benedettini",
    autore: "Giovanni Battista Vaccarini e maestranze catanesi",
    anno: "1739–1760",
    categoria: "monumento",
    sala: "Chiostro di Levante e Giardino dei Novizi",
    breve_sintesi:
      "Capolavoro del tardo barocco siciliano sorto sulle colate laviche, oggi sede universitaria e patrimonio UNESCO.",
    immagine_url: "/images/monastero-benedettini.svg",
    ente_id: 5,
    ente_nome: ENTI[5].nome,
    citta: "Catania",
    lat: 37.5037,
    lng: 15.0802,
    has_archivio: true,
    descrizione_ufficiale:
      "Il complesso monastico di San Nicolò l'Arena rappresenta una delle più ampie fabbriche monastiche d'Europa. Ricostruito dopo la colata lavica del 1669 e il sisma del 1693 con il decisivo contributo di Giovanni Battista Vaccarini, integra stratificazioni archeologiche romane, basamenti in pietra lavica e luminose logge in pietra calcarea bianca di Siracusa.",
    ente: ENTI[5],
    documento_archivio: {
      id: 107,
      segnatura: "ASCt, Corporazioni Religiose Soppresse, Benedettini, Vol. 89",
      fondo: "Fondo Monastero di San Nicolò l'Arena",
      titolo: "Libro di fabbrica del Chiostro di Levante e del Refettorio",
      datazione: "1744–1752",
      estratto_verificato:
        "Pagamenti agli intagliatori di pietra bianca per li capitelli compositi e le balaustre della galleria superiore prospiciente l'Etna.",
      immagine_url: "/images/monastero-benedettini.svg",
      ente_conservazione: "Archivio di Stato di Catania",
    },
  },
];

export const MOCK_OPERE: OperaDetailOut[] = [
  ...BASE_CATANIA_OPERE,
  ...SICILY_EXTRA_OPERE,
];

const NARRATIONS: Record<
  number,
  Record<LivelloCompetenza, Omit<NarrazioneOut, "opera_id" | "livello" | "from_cache">>
> = {
  1: {
    bambino: {
      testo_lettura:
        "Immagina un castello gigante costruito vicino al mare da un imperatore molto curioso che amava i libri, le stelle e i falchi! Questo grande arco a strisce nere di lava dell'Etna e pietra bianca splendente era la porta principale da cui passavano i cavalieri, i messaggeri e le guardie del re.\n\nSe alzi gli occhi proprio sopra la punta dell'arco, noterai un'aquila scolpita nella pietra che da quasi ottocento anni fa la guardia all'ingresso. Negli antichi registri della città si legge ancora l'ordine dato ai muratori di custodire con cura ogni singola pietra bianca di questo arco, così che l'aquila dell'imperatore non perdesse mai il suo splendore.",
      script_audio:
        "Immagina un castello gigante costruito vicino al mare da un imperatore molto curioso che amava i libri, le stelle e i falchi. Questo grande arco a strisce nere di lava dell'Etna e pietra bianca splendente era la porta principale da cui passavano i cavalieri e le guardie del re. Se alzi gli occhi sopra la punta dell'arco, noterai un'aquila scolpita nella pietra che da quasi ottocento anni fa la guardia all'ingresso. Negli antichi registri della città si legge ancora l'ordine dato ai muratori di custodire ogni pietra bianca di questo arco.",
      curiosita:
        "Un tempo le onde del mare sbattevano proprio sotto questo castello: fu l'eruzione dell'Etna del 1669 a spostare la spiaggia più lontano!",
      fonti_citate: [
        "Scheda Museo Civico Castello Ursino",
        "ASCt, Fondo Senato Civico, Reg. 14",
      ],
    },
    ragazzo: {
      testo_lettura:
        "Nel 1239 Federico II di Svevia chiamò l'architetto militare Riccardo da Lentini per progettare una fortezza praticamente invincibile sul porto di Catania. Il contrasto netto tra la pietra lavica nera dell'Etna e il calcare chiaro di Siracusa trasforma questo portale in un vero manifesto di potere medievale, pensato per colpire chiunque arrivasse via mare o attraversasse il fossato.\n\nA renderlo ancora più affascinante è la sua storia di sopravvivenza documentata negli archivi: già nel 1534 il Senato cittadino ordinò lavori specifici per consolidare i conci bianchi e salvare l'aquila imperiale. Un secolo dopo, la gigantesca colata lavica del 1669 riempì il fossato e allontanò per sempre il mare, lasciando il castello nel cuore della città come testimone silenzioso della forza del vulcano.",
      script_audio:
        "Nel milleduecentotrentanove Federico Secondo di Svevia chiamò l'architetto Riccardo da Lentini per progettare una fortezza sul porto di Catania. Il contrasto netto tra la pietra lavica nera e il calcare chiaro trasforma questo portale in un manifesto di potere medievale. I documenti d'archivio raccontano che già nel millecinquecentotrentaquattro il Senato cittadino ordinò lavori per consolidare l'arco e proteggere l'aquila imperiale. Un secolo dopo, la colata lavica del milleseicentosessantanove riempì il fossato e allontanò il mare, cambiando per sempre la geografia della città.",
      curiosita:
        "Nel Settecento e nell'Ottocento il Castello Ursino fu usato perfino come prigione prima di rinascere come museo pubblico.",
      fonti_citate: [
        "Architettura Federiciana in Sicilia",
        "ASCt, Fondo Senato Civico, Reg. 14",
      ],
    },
    adulto: {
      testo_lettura:
        "Commissionato da Federico II di Svevia tra il 1239 e il 1250 al magister architectus Riccardo da Lentini, il Portale Svevo sintetizza il rigore geometrico e la chiarezza simbolica dei castelli imperiali siciliani. L'alternanza bicroma di basalto lavico locale e pietra calcarea chiara esalta il profilo ogivale dell'arco, culminante nella nicchia con l'altorilievo dell'aquila sveva che ghermisce la preda: un segno inequivocabile della sovranità imperiale sul Mediterraneo.\n\nCome attesta un mandato del Fondo Senato Civico conservato all'Archivio di Stato di Catania (15 maggio 1534), la manutenzione del portale e dei suoi conci bianchi sopra il fossato era considerata prioritaria dalla città. Originariamente lambito dalle acque del porto, questo ingresso attraversò indenne sia la colata lavica del 1669 sia il terremoto del 1693, conservando fino a oggi l'impronta originaria della Catania federiciana.",
      script_audio:
        "Commissionato da Federico Secondo di Svevia tra il milleduecentotrentanove e il milleduecentocinquanta all'architetto Riccardo da Lentini, il Portale Svevo sintetizza il rigore geometrico dei castelli imperiali siciliani. L'alternanza tra basalto lavico scuro e calcare chiaro esalta l'arco a sesto acuto e l'altorilievo dell'aquila sveva. Un mandato del millecinquecentotrentaquattro conservato all'Archivio di Stato di Catania testimonia la cura con cui la città consolidava i conci bianchi sopra il fossato. Originariamente lambito dal mare, questo ingresso superò la colata del milleseicentosessantanove e il sisma del milleseicentonovantatré, custodendo la memoria della Catania federiciana.",
      curiosita:
        "La bicromia tra pietra vulcanica scura e calcare chiaro diventerà nei secoli la cifra cromatica più riconoscibile del centro storico etneo.",
      fonti_citate: [
        "Museo Civico Castello Ursino — Catalogo Monumenti",
        "ASCt, Fondo Senato Civico, Reg. 14, fol. 42r",
      ],
    },
    esperto: {
      testo_lettura:
        "Il fornice d'accesso sul prospetto settentrionale del castrum Ursini, attribuito alla direzione progettuale del praepositus aedificiis Riccardo da Lentini (1239–1250), esibisce un impianto a ghiera ogivale bicroma con conci radiali alternati in basalto etneo e calcarenite siracusana. La composizione evidenzia l'innesto fra la tradizione stereotomica normanna e il lessico gotico-cistercense promosso dalla corte federiciana.\n\nIl registro d'archivio del 15 maggio 1534 (ASCt, Fondo Senato Civico, Reg. 14, fol. 42r) attesta puntuali interventi cinquecenteschi di consolidamento strutturale dei conci bianchi sovrastanti il fossato reale, con esplicita prescrizione di tutela dell'emblema aquilino. L'analisi stratigrafica dell'imposta muraria conferma inoltre l'innalzamento della quota pavimentale esterna conseguente all'avanzamento della colata lavica del 1669.",
      script_audio:
        "Il fornice d'accesso sul prospetto settentrionale del Castello Ursino, progettato da Riccardo da Lentini tra il milleduecentotrentanove e il milleduecentocinquanta, presenta un arco ogivale bicromo con conci alternati in basalto etneo e calcarenite siracusana, sintesi tra tradizione normanna e rigore gotico federiciano. Il registro d'archivio del quindici maggio millecinquecentotrentaquattro documenta interventi di consolidamento dei conci bianchi sopra il fossato reale con espressa tutela dell'emblema dell'aquila imperiale.",
      curiosita:
        "Il rilievo dell'aquila che ghermisce una lepre o un ariete riprende schemi iconografici diffusi nei sigilli cancellereschi della corte sveva.",
      fonti_citate: [
        "ASCt, Fondo Senato Civico, Reg. 14, fol. 42r",
        "C.A. Willemsen, I castelli di Federico II",
      ],
    },
  },
  2: {
    bambino: {
      testo_lettura:
        "Questa tavola dipinta racconta la storia di Agata, la ragazza coraggiosa che tutta Catania festeggia con grande emozione ogni febbraio. Il pittore ha usato luci dorate e ombre profonde, proprio come i riflettori di un teatro, per far risaltare il suo volto tranquillo e luminoso mentre tiene tra le mani un ramo di palma, simbolo di vittoria e speranza.\n\nSappiamo persino come appariva questo quadro più di quattrocento anni fa! Un antico notaio scrisse su un grande quaderno che era dipinto su legno di noce e circondato da una cornice ricoperta d'oro vero, costruita apposta per far brillare la luce delle candele nella cappella dove si trovava.",
      script_audio:
        "Questa tavola dipinta racconta la storia di Agata, la ragazza coraggiosa che tutta Catania festeggia ogni febbraio. Il pittore ha usato luci dorate e ombre profonde come in un teatro per far risaltare il suo volto sereno e il ramo di palma tra le mani. Un antico documento notarile ci rivela che l'opera fu dipinta su legno di noce e racchiusa in una cornice ricoperta d'oro vero, pensata per brillare alla luce delle candele.",
      curiosita:
        "Il velo rosso della santa è diventato il simbolo di protezione della città davanti alle eruzioni dell'Etna.",
      fonti_citate: [
        "Pinacoteca Castello Ursino",
        "ASCt, Notai Defunti, Vol. 218",
      ],
    },
    ragazzo: {
      testo_lettura:
        "Dipinta nella bottega di Filippo Paladini intorno al 1605, questa tavola colpisce subito per il contrasto drammatico tra luce e ombra, quasi fosse una scena cinematografica girata a lume di candela. Mentre intorno si muovono figure agitate, al centro resta salda e luminosa la figura di Agata, attorno alla quale ruota da quasi due millenni l'identità culturale e civile di Catania.\n\nGrazie a un atto notarile del 1606 conservato in archivio conosciamo dettagli sorprendenti sulla sua origine: il dipinto fu commissionato per un oratorio cittadino su un prezioso supporto in legno di noce con cornice in foglia d'oro. Sopravvissuta miracolosamente al devastante terremoto del 1693, l'opera è oggi uno dei ponti più diretti verso la Catania del Seicento.",
      script_audio:
        "Dipinta nella bottega di Filippo Paladini intorno al milleseicentocinque, questa tavola usa un contrasto potente tra luce e ombra, quasi cinematografico. Al centro resta salda e luminosa la figura di Agata, simbolo dell'identità di Catania. Un atto notarile del milleseicentosei rivela che fu realizzata su legno di noce con cornice dorata per un oratorio cittadino e che sopravvisse al grande terremoto del milleseicentonovantatré.",
      curiosita:
        "Un atto notarile del 1606 ci rivela persino il legno scelto per il supporto: legno di noce con cornice in foglia d'oro.",
      fonti_citate: [
        "Catalogo Dipinti Castello Ursino",
        "ASCt, Notai Defunti, Vol. 218",
      ],
    },
    adulto: {
      testo_lettura:
        "Realizzata nell'ambito della bottega di Filippo Paladini agli albori del XVII secolo, la tavola traduce il dramma del martirio di Sant'Agata in una composizione intensamente calibrata tra naturalismo lombardo-toscano e pathos devozionale siciliano. Lo sguardo della santa, immerso in una luce radente che scolpisce i panneggi e i volti circostanti, guida l'osservatore verso il centro emotivo della scena senza mai cedere all'eccesso teatrale.\n\nGli atti conservati nel Fondo Notai Defunti dell'Archivio di Stato di Catania (12 febbraio 1606) documentano con precisione la committenza originaria per un oratorio cittadino, specificando il pregio del supporto in legno di noce e della cornice dorata. La sua conservazione attraverso le distruzioni del sisma del 1693 ne accresce il valore come rarissima testimonianza pittorica della Catania pre-barocca.",
      script_audio:
        "Realizzata nella bottega di Filippo Paladini agli inizi del Seicento, la tavola traduce il martirio di Sant'Agata in una composizione equilibrata tra naturalismo e devozione siciliana. La luce radente scolpisce i volti e guida lo sguardo verso la figura serena della santa. Gli atti notarili del milleseicentosei conservati all'Archivio di Stato confermano la committenza per un oratorio cittadino su legno di noce con cornice dorata, rendendola una rara testimonianza salvatasi dal terremoto del milleseicentonovantatré.",
      curiosita:
        "Le feste agatine rappresentano una delle manifestazioni religiose e civiche più partecipate del Mediterraneo.",
      fonti_citate: [
        "Museo Civico Castello Ursino — Sala IV",
        "ASCt, Notai Defunti, Vol. 218, c. 119v",
      ],
    },
    esperto: {
      testo_lettura:
        "La tavola (ca. 1605) evidenzia la matura ricezione catanese della maniera riformata introdotta in Sicilia dal fiorentino Filippo Paladini, coniugando saldezza disegnativa tardo-manierista e una modulazione luministica già sensibile alle istanze controriformate di chiarezza narrativa. L'equilibrio cromatico dei rossi lacca e delle terre bruciate sostiene la gerarchia iconografica imperniata sulla palma del martirio.\n\nL'inventario notarile rogato il 12 febbraio 1606 (ASCt, Notai Defunti, Vol. 218, c. 119v) fornisce un prezioso terminus ante quem, confermando la stesura su tavola di noce e l'originaria destinazione confraternale con cornice intagliata in foglia d'oro. La sopravvivenza del manufatto al collasso del patrimonio ecclesiastico nel sisma del gennaio 1693 lo qualifica come caposaldo per lo studio della pittura etnea del primo Seicento.",
      script_audio:
        "La tavola mostra la ricezione catanese della maniera riformata introdotta in Sicilia da Filippo Paladini, unendo rigore disegnativo e luminismo controriformato. L'inventario notarile del dodici febbraio milleseicentosei attesta il supporto in legno di noce e la destinazione confraternale con cornice dorata, offrendo una testimonianza rara del patrimonio pittorico antecedente al sisma del milleseicentonovantatré.",
      curiosita:
        "Pochi dipinti su tavola catanesi superarono indenni il crollo degli edifici ecclesiastici nel sisma del 1693.",
      fonti_citate: [
        "ASCt, Notai Defunti, Vol. 218, c. 119v",
        "Archivio Pinacoteca Castello Ursino",
      ],
    },
  },
  3: {
    bambino: {
      testo_lettura:
        "Questa scultura è la corazza di marmo bianco di un antico imperatore romano di nome Claudio! Anche se il tempo ha portato via la testa e le braccia, gli scultori di duemila anni fa furono così bravi che puoi ancora ammirare ogni minimo dettaglio scolpito nel marmo.\n\nSul petto vedrai due figure alate che festeggiano una vittoria e, proprio al centro, il volto di Medusa circondato da serpenti: per i Romani non era solo una decorazione, ma un potente simbolo magico pensato per proteggere l'imperatore e spaventare i nemici in battaglia!",
      script_audio:
        "Questa scultura è la corazza di marmo bianco di un antico imperatore romano di nome Claudio. Anche se mancano la testa e le braccia, puoi ammirare i dettagli scolpiti duemila anni fa: due figure alate sul petto e il volto di Medusa al centro, usato dai Romani come simbolo protettivo contro i nemici.",
      curiosita:
        "In epoca romana spesso si scolpivano corpi standard e poi si cambiava solo la testa con il ritratto del nuovo imperatore!",
      fonti_citate: ["Collezione Archeologica Castello Ursino — Sala II"],
    },
    ragazzo: {
      testo_lettura:
        "Un reperto in marmo bianco di Carrara vecchio duemila anni che racconta quanto fosse importante la Catania imperiale romana. Questa corazza anatomica scolpita per l'imperatore Claudio funzionava come un vero manifesto politico in 3D, esposto in una piazza o in un teatro affollato perché tutti riconoscessero l'autorità di Roma.\n\nOsservandola da vicino si scopre una lavorazione straordinaria: due Vittorie alate celebrano il trionfo imperiale, mentre al centro spicca il volto di Medusa (il Gorgoneion) e in basso pendono le frange scolpite che imitano le strisce di cuoio delle vere armature militari.",
      script_audio:
        "Un reperto in marmo bianco vecchio duemila anni che racconta la Catania imperiale romana. Questa corazza scolpita per l'imperatore Claudio era esposta in uno spazio pubblico per celebrare il potere di Roma, decorata con due Vittorie alate, il volto di Medusa al centro e le frange scolpite che imitavano il cuoio delle armature dei generali.",
      curiosita:
        "Il marmo proveniva dalle cave di Luni in Toscana e viaggiava via mare fino al porto di Catania.",
      fonti_citate: ["Lapidario Civico di Castello Ursino"],
    },
    adulto: {
      testo_lettura:
        "Scolpito in prezioso marmo bianco lunense nella metà del I secolo d.C., il torso loricato apparteneva a una monumentale statua onoraria collocata in uno dei principali spazi pubblici della Catina romana, con ogni probabilità il teatro o il foro. La scultura mostra la padronanza tecnica delle officine imperiali nel modellare la corazza anatomica aderente al corpo.\n\nL'apparato decorativo racchiude un preciso programma di propaganda dinastica giulio-claudia: al centro del petto campeggia il Gorgoneion apotropaico, affiancato da due Vittorie alate simmetriche, mentre la doppia fila di pteruges frangiati restituisce la solennità dell'abbigliamento militare del comandante supremo.",
      script_audio:
        "Scolpito in marmo bianco lunense nella metà del primo secolo dopo Cristo, il torso loricato apparteneva a una statua onoraria esposta in un grande edificio pubblico della Catania romana. Il volto di Medusa al centro, le due Vittorie alate e le frange scolpite della corazza esprimono con raffinatezza la propaganda imperiale della dinastia giulio claudia.",
      curiosita:
        "Le frange inferiori della corazza, chiamate pteruges, imitavano le strisce di cuoio flessibile usate dai comandanti in battaglia.",
      fonti_citate: ["Museo Civico Castello Ursino — Catalogo Reperti Romani"],
    },
    esperto: {
      testo_lettura:
        "Torace loricato in marmo bianco lunense ascrivibile alla statuaria imperiale di età claudia (41–54 d.C.), testimonianza eminente dell'evergetismo civico e della cultura figurativa della colonia romana di Catina. La lorica musculata, rifinita con sottile modellato chiaroscurale, reca il Gorgoneion sotto il balteus, una coppia di Vittorie affrontate e una doppia serie di pteruges frangiati e decorati.\n\nL'incavo lavorato all'altezza del collo documenta la prassi scultorea romana dell'innesto separato della testa-ritratto, funzionale sia alla divisione del lavoro di bottega sia a possibili rilavorazioni dinastiche. Il pezzo è confluito nelle collezioni civiche di Castello Ursino tramite il collezionismo antiquario catanese settecentesco legato al Museo Biscari.",
      script_audio:
        "Torace loricato in marmo lunense della statuaria imperiale di età claudia, tra il quarantuno e il cinquantaquattro dopo Cristo. La corazza anatomica presenta il Gorgoneion sotto il balteus, due Vittorie affrontate e doppia serie di frange scolpite, con incavo del collo predisposto per la testa-ritratto intercambiabile.",
      curiosita:
        "La rilavorazione del collo a incasso conferma la pratica romana dell'intercambiabilità della testa-ritratto.",
      fonti_citate: ["Collezione Biscari — Inventario Archeologico Castello Ursino"],
    },
  },
  4: {
    bambino: {
      testo_lettura:
        "Guarda questa grande mappa disegnata e colorata a mano più di trecento anni fa! Quella lunga striscia rossa infuocata che scende giù dalla montagna non è una strada: è un vero fiume di lava uscito dall'Etna nella primavera del 1669.\n\nLa mappa mostra passo dopo passo il cammino della lava fino alle mura di Catania e al Castello Ursino. La colata arrivò addirittura dentro il mare, creando una nuova riva di roccia nera dove prima nuotavano i pesci e attraccavano le barche!",
      script_audio:
        "Guarda questa mappa disegnata e colorata a mano più di trecento anni fa. Quella lunga striscia rossa che scende dalla montagna è un fiume di lava uscito dall'Etna nel milleseicentosessantanove. La mappa racconta come la lava raggiunse le mura di Catania e il Castello Ursino fino a spingere indietro il mare, creando una nuova costa di pietra nera.",
      curiosita:
        "Per deviare la lava fuori dalla città, alcuni cittadini coraggiosi tentarono un'impresa eroica con picconi e pelli bagnate.",
      fonti_citate: [
        "Archivio di Stato di Catania",
        "Fondo Topografico e Fortificazioni",
      ],
    },
    ragazzo: {
      testo_lettura:
        "Una vera istantanea cartografica d'emergenza realizzata nell'agosto del 1669! Quando non esistevano né satelliti né fotografie aeree, un ingegnere militare percorse il territorio e disegnò a mano il tracciato esatto della colata lavica più famosa della storia dell'Etna.\n\nOsservando i colori e le linee di questa pianta puoi vedere dove la lava urtò i bastioni occidentali, come circondò il Castello Ursino colmandone il fossato e in che modo ridisegnò per sempre la linea di costa di Catania. È un documento prezioso tanto per gli storici quanto per i vulcanologi moderni.",
      script_audio:
        "Una vera istantanea cartografica d'emergenza del milleseicentosessantanove. Un ingegnere militare disegnò a mano il percorso della colata lavica più celebre dell'Etna, mostrando l'impatto sui bastioni cittadini, sul Castello Ursino e sulla costa di Catania. Ancora oggi storici e vulcanologi studiano questa mappa per capire la portata di quell'eruzione.",
      curiosita:
        "La collina dei Monti Rossi vicino Nicolosi nacque proprio durante quella gigantesca eruzione.",
      fonti_citate: ["ASCt, Fondo Intendenza Borbonica, Cart. 7"],
    },
    adulto: {
      testo_lettura:
        "Questa mappa acquerellata dell'agosto 1669 costituisce un documento storico ed emotivo eccezionale per comprendere la geografia urbana della Catania seicentesca. Tracciata con il rigore geometrico di un ingegnere militare al servizio vicereale, la carta segue l'avanzata della lingua di fuoco dall'area dei Monti Rossi fino all'assedio delle mura occidentali e al colmamento del porto attorno al Castello Ursino.\n\nConservata nel Fondo Topografico dell'Archivio di Stato di Catania insieme alla relazione sui danni alle cortine bastionate, la pianta ci restituisce l'immagine esatta del momento in cui il vulcano modificò irreversibilmente la fisionomia della città, ponendo le basi topografiche della ricostruzione moderna.",
      script_audio:
        "Questa mappa acquerellata dell'agosto milleseicentosessantanove è un documento storico eccezionale per comprendere la geografia di Catania nel Seicento. Redatta da un ingegnere militare, segue la lingua di lava fino alle mura occidentali e attorno al Castello Ursino, testimoniando il momento in cui l'eruzione ridisegnò per sempre la costa e l'assetto urbano della città.",
      curiosita:
        "Sopra lo strato di lava raffreddata sorse nei decenni successivi l'intero quartiere costiero e la zona di piazza Palestro.",
      fonti_citate: [
        "Archivio di Stato di Catania — Sala Cartografica",
        "ASCt, Fondo Topografico, Cart. 7, tav. 2",
      ],
    },
    esperto: {
      testo_lettura:
        "Rilievo cartografico manoscritto acquerellato su carta vergata (agosto 1669), elaborato da tecnico militare vicereale per la ricognizione estimativa dei danni alle cortine bastionate e agli approdi di Catania. Il tracciato cromatico registra con notevole attendibilità topografica le diramazioni effusive dai coni avventizi dei Monti Rossi fino al fronte costiero meridionale.\n\nLa tavola, correlata alla relazione conservata in ASCt (Fondo Intendenza Borbonica, Cart. 7, tav. 2), consente l'analisi comparativa tra l'impianto difensivo cinquecentesco e la nuova linea di costa generata dalla colata. La scala espressa in canne siciliane offre tuttora parametri attendibili per la modellazione vulcanologica storica dell'eruzione del 1669.",
      script_audio:
        "Rilievo cartografico manoscritto dell'agosto milleseicentosessantanove, redatto da un ingegnere militare vicereale per stimare i danni alle mura bastionate e agli approdi di Catania. Il tracciato documenta le diramazioni laviche dai Monti Rossi fino al mare e fornisce ancora oggi dati preziosi per la ricerca storica e vulcanologica.",
      curiosita:
        "La scala espressa in canne siciliane permette oggi ai vulcanologi di ricostruire con precisione la portata dell'effusione del 1669.",
      fonti_citate: [
        "ASCt, Fondo Intendenza Borbonica, Cart. 7, tav. 2",
        "Archivio Storico Cartografico Siciliano",
      ],
    },
  },
  5: {
    bambino: {
      testo_lettura:
        "Sotto le strade, le piazze e i palazzi del centro di Catania si nasconde uno stadio romano gigantesco, costruito quasi duemila anni fa con la pietra nera dell'Etna e mattoni rossi! Poteva ospitare circa quindicimila spettatori seduti sulle sue gradinate, proprio come un grande stadio moderno.\n\nOggi ne vediamo solo una parte che sbuca al centro di Piazza Stesicoro, come una finestra segreta aperta sul passato: gli altri grandi archi continuano silenziosi proprio sotto i nostri piedi, sotto i negozi e le case settecentesche della città!",
      script_audio:
        "Sotto le strade del centro di Catania si nasconde uno stadio romano gigantesco costruito con la pietra nera dell'Etna e mattoni rossi. Poteva ospitare quindicimila spettatori sulle gradinate, proprio come uno stadio moderno. Oggi in Piazza Stesicoro ne vediamo una parte che sbuca come una finestra sul passato, mentre il resto degli archi continua sotto i palazzi della città.",
      curiosita:
        "Oggi ne vediamo solo un pezzo perché nel Settecento la città nuova è stata ricostruita proprio sopra i suoi archi antichi!",
      fonti_citate: ["Area Archeologica di Piazza Stesicoro"],
    },
    ragazzo: {
      testo_lettura:
        "Camminando in Piazza Stesicoro basta affacciarsi alla balaustra per fare un salto diretto nella Catania del II secolo dopo Cristo. Realizzato interamente in blocchi di basalto lavico scuro e archi in mattoni rossi, questo Anfiteatro era uno dei più grandi dell'intero Impero Romano e dimostra quanto fosse ricca, viva e popolosa la città antica.\n\nQuello che vedi allo scoperto è solo una porzione del grande anello ellittico: il resto è inglobato nei sotterranei degli edifici circostanti, trasformando il centro storico di Catania in una straordinaria città a strati dove l'epoca romana e il barocco convivono a pochi metri di distanza.",
      script_audio:
        "Affacciandoti in Piazza Stesicoro fai un salto diretto nella Catania del secondo secolo dopo Cristo. Costruito in blocchi di pietra lavica scura e mattoni rossi, l'Anfiteatro era tra i più grandi dell'Impero Romano. La parte visibile è solo una porzione del grande anello, che prosegue sotto gli edifici barocchi del centro.",
      curiosita:
        "Si dice persino che il re goto Teodorico autorizzò nel VI secolo a riutilizzarne le pietre cadute per riparare le mura cittadine.",
      fonti_citate: ["Parco Archeologico e Paesaggistico di Catania"],
    },
    adulto: {
      testo_lettura:
        "Incastonato al centro di Piazza Stesicoro, l'Anfiteatro Romano del II secolo d.C. testimonia il ruolo di primo piano raggiunto da Catania nella Sicilia imperiale. L'alternanza costruttiva tra i blocchi di basalto lavico scuro e le ghiere in laterizio rosso creava un vigoroso effetto cromatico sulle arcate esterne, pensate per accogliere fino a quindicimila spettatori.\n\nRimasto a lungo celato sotto le stratificazioni medievali e la ricostruzione barocca successiva al 1693, il monumento fu riportato parzialmente alla luce agli inizi del Novecento. Oggi offre uno spaccato irripetibile sulla continuità millenaria dell'urbanistica catanese, in cui la città moderna poggia letteralmente sulle fondamenta dell'antichità.",
      script_audio:
        "Incastonato in Piazza Stesicoro, l'Anfiteatro Romano del secondo secolo dopo Cristo testimonia lo splendore di Catania in età imperiale. Le arcate in pietra lavica scura e mattoni rossi potevano accogliere quindicimila spettatori. Riportato parzialmente alla luce agli inizi del Novecento, mostra in modo spettacolare come la città barocca sorga direttamente sulle fondamenta romane.",
      curiosita:
        "L'arena era così grande che in passato alcuni viaggiatori ipotizzarono potesse essere allagata per piccole naumachie.",
      fonti_citate: ["Soprintendenza BB.CC.AA. Catania — Anfiteatro Romano"],
    },
    esperto: {
      testo_lettura:
        "Edificio per spettacoli gladiatorii databile al II secolo d.C. con probabili ampliamenti di età severiana, caratterizzato da un'ellisse maggiore superiore ai centoventicinque metri e da tre ordini di ambulacri coperti. La tecnica edilizia impiega paramenti in opus vittatum lavico, archi in laterizio legati con malta pozzolanica etnea e rivestimenti marmorei nelle zone d'onore.\n\nLe campagne di scavo promosse dall'architetto Filadelfo Fichera tra il 1904 e il 1907 liberarono il settore meridionale affacciato su Piazza Stesicoro, lasciando leggibili le complesse dinamiche di spoliazione tardoantica (già attestate nelle Variae di Cassiodoro) e di riutilizzo strutturale nei palazzi settecenteschi.",
      script_audio:
        "Edificio per spettacoli del secondo secolo dopo Cristo con ellisse maggiore superiore a centoventicinque metri e tre ordini di ambulacri. La tecnica costruttiva alterna paramenti in pietra lavica e archi in laterizio; gli scavi guidati da Filadelfo Fichera tra il millenovecentoquattro e il millenovecentosette ne hanno svelato il settore meridionale e le stratificazioni storiche.",
      curiosita:
        "Gran parte dell'emiciclo settentrionale continua a svilupparsi sotto l'asse di via Neve e via Anfiteatro.",
      fonti_citate: ["Relazioni di Scavo Fichera 1907 — Area Piazza Stesicoro"],
    },
  },
  6: {
    bambino: {
      testo_lettura:
        "Su questi fogli antichi pieni di righe musicali, un giovane compositore nato proprio a Catania, Vincenzo Bellini, scrisse con penna e inchiostro una delle melodie più famose di tutto il mondo: Casta Diva! Non la trovò subito al primo colpo: cancellò, corresse e ridisegnò le note tantissime volte finché la musica non gli sembrò limpida e luminosa come la luna.\n\nGuardando i suoi segni veloci a inchiostro sembra quasi di vederlo seduto al pianoforte mentre canticchia ogni frase per renderla sempre più dolce e indimenticabile.",
      script_audio:
        "Su questi fogli antichi Vincenzo Bellini, nato a Catania, scrisse con penna e inchiostro una delle melodie più famose al mondo: Casta Diva. Cancellò e ridisegnò le note tantissime volte finché la musica non sembrò luminosa come la luna, lasciandoci un ricordo vivo del suo modo di comporre.",
      curiosita:
        "Bellini aveva appena trent'anni quando quest'opera debuttò a Milano e fece emozionare tutto il teatro!",
      fonti_citate: [
        "Museo Civico Belliniano Catania",
        "Fondo Autografi Belliniani",
      ],
    },
    ragazzo: {
      testo_lettura:
        "Prima degli studi di registrazione e dei software musicali, i grandi compositori costruivano i loro capolavori a mano su carta pentagrammata, cancellando, riscrivendo e limando ogni singola nota. Qui osservi da vicino i bozzetti originali della 'Norma' di Vincenzo Bellini, nati nel 1831 poco prima del debutto al Teatro alla Scala di Milano.\n\nDietro quella melodia che sembra semplicissima e spontanea c'erano in realtà otto versioni scartate e un dialogo serrato con il librettista Felice Romani: una prova concreta che anche il genio musicale nasce da pazienza, ascolto e continua ricerca.",
      script_audio:
        "Prima dei moderni studi di registrazione, i grandi compositori riscrivevano ogni nota a mano su carta pentagrammata. Qui vedi i bozzetti originali della Norma di Vincenzo Bellini del milleottocentotrentuno: dietro la celebre melodia di Casta Diva ci furono otto diverse versioni e un lavoro instancabile con il librettista Felice Romani.",
      curiosita:
        "La melodia di Casta Diva era così amata da Richard Wagner che la definì una delle creazioni più pure del melodramma.",
      fonti_citate: ["MCB, Fondo Autografi Belliniani, Ms. B-1831/4"],
    },
    adulto: {
      testo_lettura:
        "Conservati nella casa natale del compositore a Catania, questi fogli autografi aprono uno spiraglio prezioso sul laboratorio creativo di Vincenzo Bellini nell'autunno del 1831, alla vigilia della prima milanese della Norma. Le cancellature, i ripensamenti melodici e le rapide annotazioni a margine svelano la genesi della celebre 'melodia lunga', capace di fondere parola poetica e cantabilità pura.\n\nLe fonti archivistiche del Fondo Autografi Belliniani confermano che Bellini riscrisse più volte la cavatina 'Casta Diva' per trovare l'equilibrio perfetto tra respiro vocale e atmosfera notturna, consegnando alla storia dell'opera lirica una delle sue pagine più alte e universali.",
      script_audio:
        "Conservati nella casa natale del compositore, questi fogli autografi svelano il laboratorio creativo di Vincenzo Bellini nell'autunno del milleottocentotrentuno, prima della prima milanese della Norma. Le correzioni e le note a margine documentano la nascita della melodia lunga e la ricerca di perfezione dietro la celebre aria Casta Diva.",
      curiosita:
        "Bellini collaborava strettamente con il librettista Felice Romani, chiedendogli versi sempre più essenziali per far respirare la musica.",
      fonti_citate: [
        "Museo Civico Belliniano — Sala III",
        "MCB, Fondo Autografi Belliniani, Ms. B-1831/4",
      ],
    },
    esperto: {
      testo_lettura:
        "Testimone manoscritto autografo relativo alla fase elaborativa della cavatina 'Casta Diva' (Norma, Atto I, sc. 4, autunno 1831), conservato presso il Museo Civico Belliniano (Ms. B-1831/4). Le varianti diastematiche, le correzioni dell'accompagnamento orchestrale e le indicazioni agogiche vergate su carta pentagrammata milanese documentano la celebre serie di otto redazioni menzionata nell'epistolario.\n\nIl manoscritto illumina con chiarezza filologica tanto la dialettica drammaturgica con i versi di Felice Romani quanto la calibratura tessiturale sul timbro sopranile di Giuditta Pasta, culminata poi nella celebre trasposizione tonale decisa alle prove generali alla Scala.",
      script_audio:
        "Testimone manoscritto autografo della genesi della cavatina Casta Diva dalla Norma del milleottocentotrentuno. Le varianti melodiche e le annotazioni orchestrali documentano il lavoro filologico compiuto in dialogo con il librettista Felice Romani e sulla vocalità di Giuditta Pasta.",
      curiosita:
        "La trasposizione tonale da Sol maggiore a Fa maggiore fu decisa in prova generale per esaltare la morbidezza timbrica dell'aria.",
      fonti_citate: [
        "MCB, Fondo Autografi Belliniani, Ms. B-1831/4",
        "Epistolario Belliniano",
      ],
    },
  },
  7: {
    bambino: {
      testo_lettura:
        "Questo palazzo gigantesco sembra davvero una piccola città dentro la città! Tantissimo tempo fa ci vivevano i monaci benedettini, ma prima un fiume di lava dell'Etna e poi un grande terremoto li misero a dura prova. Invece di arrendersi, decisero di ricostruire tutto ancora più luminoso e spettacolare.\n\nCosì nacque questo chiostro pieno di archi eleganti, colonne di pietra bianca splendente e un giardino silenzioso con alberi d'arancio. Oggi non ci sono più i monaci, ma migliaia di ragazzi che vengono qui ogni giorno a studiare circondati da bellezza e storia!",
      script_audio:
        "Questo palazzo gigantesco sembra una città dentro la città. Un tempo vi vivevano i monaci benedettini che, dopo la lava dell'Etna e un forte terremoto, ricostruirono tutto ancora più luminoso, con colonne di pietra bianca e un giardino pieno di aranci. Oggi queste sale accolgono migliaia di studenti universitari.",
      curiosita:
        "Oggi dentro queste sale studiano migliaia di studenti universitari accanto a resti romani vecchi duemila anni!",
      fonti_citate: [
        "Monastero dei Benedettini Catania",
        "ASCt, Fondo Benedettini, Vol. 89",
      ],
    },
    ragazzo: {
      testo_lettura:
        "È uno dei complessi monastici più grandi d'Europa e oggi è un campus universitario vivo, aperto a tutti e riconosciuto dall'UNESCO come patrimonio dell'umanità. Attraversando il Chiostro di Levante puoi leggere l'intera storia di Catania a strati: mosaici di una domus romana nei sotterranei, la lava solidificata del 1669 che circonda le fondamenta e le scenografiche logge barocche che guardano verso l'Etna.\n\nNegli archivi di Stato esistono ancora i registri originali dei lavori settecenteschi, con i nomi degli scalpellini che intagliarono a mano i capitelli e le balaustre in pietra bianca che ancora oggi risplendono sotto il sole siciliano.",
      script_audio:
        "È uno dei complessi monastici più grandi d'Europa e oggi ospita un campus universitario patrimonio Unesco. Qui vedi la storia di Catania a strati: mosaici romani nei sotterranei, la lava del milleseicentosessantanove e i luminosi chiostri barocchi progettati nel Settecento. I libri d'archivio conservano perfino i nomi degli scalpellini che intagliarono la pietra bianca.",
      curiosita:
        "L'architetto Giancarlo De Carlo negli anni Ottanta progettò un restauro famoso in tutto il mondo per unire antico e contemporaneo.",
      fonti_citate: ["Complesso San Nicolò l'Arena — Catania"],
    },
    adulto: {
      testo_lettura:
        "Il Chiostro del Monastero dei Benedettini di San Nicolò l'Arena incarna in modo esemplare la rinascita settecentesca di Catania dopo la duplice catastrofe della colata lavica del 1669 e del terremoto del 1693. Su progetto di Giovanni Battista Vaccarini e grazie alla maestria degli intagliatori locali, il bianco calcare di Siracusa dialoga armoniosamente con il basalto lavico scuro, dando vita a uno degli spazi più scenografici del tardo barocco siciliano.\n\nIl Libro di Fabbrica del 1744–1752 conservato all'Archivio di Stato di Catania documenta nei minimi dettagli i pagamenti agli intagliatori per i capitelli compositi e le balaustre della galleria superiore aperta verso l'Etna, rivelando il lavoro collettivo dietro questo capolavoro monumentale.",
      script_audio:
        "Il Chiostro del Monastero dei Benedettini incarna la rinascita settecentesca di Catania dopo la lava del milleseicentosessantanove e il terremoto del milleseicentonovantatré. Su progetto di Giovanni Battista Vaccarini, il calcare bianco dialoga con il basalto scuro in uno degli spazi più suggestivi del barocco siciliano. I libri di fabbrica conservati in archivio documentano perfino i compensi degli scalpellini per i capitelli e le balaustre rivolte verso l'Etna.",
      curiosita:
        "I libri di fabbrica conservati in archivio riportano i nomi degli scalpellini e perfino i compensi settimanali per ogni capitello intagliato.",
      fonti_citate: [
        "Monastero di San Nicolò l'Arena — Guida Storica",
        "ASCt, Corporazioni Religiose Soppresse, Vol. 89",
      ],
    },
    esperto: {
      testo_lettura:
        "Chiostro di Levante del complesso benedettino di San Nicolò l'Arena (1739–1760), snodo decisivo della riconfigurazione post-sisma del 1693 improntata dal linguaggio architettonico di Giovanni Battista Vaccarini. L'articolazione delle logge porticate coniuga il rigore ritmico dell'impianto monastico con l'esuberanza plastica dell'intaglio su pietra calcarea bianca netina e siracusana, contrastata dai basamenti in basalto etneo.\n\nLe partite contabili del Libro di Fabbrica (ASCt, Corporazioni Religiose Soppresse, Benedettini, Vol. 89, 1744–1752) registrano con precisione cronologica le maestranze lapicide impiegate per capitelli compositi e balaustre della galleria superiore, attestando la continuità costruttiva del cantiere sopra le preesistenze elleno-romane e il fronte lavico del 1669.",
      script_audio:
        "Chiostro di Levante del complesso benedettino di San Nicolò l'Arena, realizzato tra il millesettecentotrentanove e il millesettecentosessanta sotto l'impulso progettuale di Giovanni Battista Vaccarini. Le partite contabili del Libro di Fabbrica documentano la fornitura di pietra calcarea bianca, i capitelli compositi e l'innesto monumentale sulle stratificazioni antiche e sulla colata del milleseicentosessantanove.",
      curiosita:
        "L'insediamento preserva in situ stratigrafie elleno-romane, cisterne antiche e la colata del 1669 arrestatasi contro il muro perimetrale ovest.",
      fonti_citate: [
        "ASCt, Corporazioni Religiose Soppresse, Benedettini, Vol. 89",
        "Dossier UNESCO Val di Noto",
      ],
    },
  },
};

const RELATED_MAP: Record<
  number,
  Array<{ targetId: number; tipo_relazione: string; motivazione: string }>
> = {
  1: [
    {
      targetId: 4,
      tipo_relazione: "Trasformazione urbana 1669",
      motivazione:
        "La pianta topografica del 1669 documenta con precisione come la colata lavica dell'Etna circondò il Castello Ursino e ne trasformò l'originario accesso marittimo.",
    },
    {
      targetId: 2,
      tipo_relazione: "Medesimo complesso museale",
      motivazione:
        "Conservata all'interno delle sale del Castello Ursino, la tavola seicentesca completa il percorso civico della fortezza federiciana.",
    },
    {
      targetId: 3,
      tipo_relazione: "Continuità lapidea",
      motivazione:
        "Il lapidario romano ospitato oltre il Portale Svevo conserva le memorie marmoree più antiche della città custodite nella fortezza.",
    },
  ],
  2: [
    {
      targetId: 1,
      tipo_relazione: "Sede di conservazione",
      motivazione:
        "Il dipinto è esposto nelle gallerie del Castello Ursino, simbolo del patrimonio storico e civico di Catania.",
    },
    {
      targetId: 5,
      tipo_relazione: "Memoria agiografica cittadina",
      motivazione:
        "La tradizione storica catanese lega le vicende del martirio di Sant'Agata agli edifici pubblici romani attorno all'area dell'Anfiteatro.",
    },
    {
      targetId: 7,
      tipo_relazione: "Devozione barocca",
      motivazione:
        "Dopo il sisma del 1693, l'arte sacra e l'architettura benedettina rinnovarono insieme l'identità religiosa e artistica della città.",
    },
  ],
  3: [
    {
      targetId: 5,
      tipo_relazione: "Contesto storico imperiale",
      motivazione:
        "Entrambi i monumenti raccontano la prosperità urbana e il programma celebrativo pubblico della Catina romana in età imperiale.",
    },
    {
      targetId: 1,
      tipo_relazione: "Collezione civica comune",
      motivazione:
        "Il reperto romano è esposto nella sezione archeologica all'interno del Castello Ursino.",
    },
    {
      targetId: 7,
      tipo_relazione: "Stratigrafia antica",
      motivazione:
        "Anche sotto i chiostri del Monastero dei Benedettini sopravvivono strutture murarie e mosaici di età romana imperiale.",
    },
  ],
  4: [
    {
      targetId: 1,
      tipo_relazione: "Impatto diretto sul monumento",
      motivazione:
        "La carta del 1669 mostra il fronte di lava che colmò il fossato attorno al Castello Ursino e modificò la linea costiera.",
    },
    {
      targetId: 7,
      tipo_relazione: "Ricostruzione post-eruzione",
      motivazione:
        "Proprio il muro occidentale del Monastero dei Benedettini fu lambito dalla colata del 1669 prima della grande ricostruzione settecentesca.",
    },
    {
      targetId: 2,
      tipo_relazione: "Culto protettivo civico",
      motivazione:
        "Durante i drammatici giorni dell'eruzione del 1669 la cittadinanza affidò la salvezza delle mura alla protezione del velo di Sant'Agata.",
    },
  ],
  5: [
    {
      targetId: 3,
      tipo_relazione: "Età romana a Catania",
      motivazione:
        "Statuaria onoraria come il Torso di Claudio ornava gli spazi pubblici e gli edifici di spettacolo della città imperiale.",
    },
    {
      targetId: 7,
      tipo_relazione: "Reimpiego costruttivo",
      motivazione:
        "Dopo i terremoti e le ricostruzioni, la pietra lavica dell'Anfiteatro e del tessuto antico entrò nei cantieri monumentali barocchi.",
    },
    {
      targetId: 4,
      tipo_relazione: "Cartografia storica urbana",
      motivazione:
        "Le carte storiche d'archivio permettono di localizzare come il centro barocco si sovrappose alle strutture romane.",
    },
  ],
  6: [
    {
      targetId: 7,
      tipo_relazione: "Paesaggio culturale ottocentesco",
      motivazione:
        "Piazza San Francesco e il vicino complesso benedettino definiscono il cuore culturale dove si formò il giovane Bellini.",
    },
    {
      targetId: 2,
      tipo_relazione: "Patrimonio civico catanese",
      motivazione:
        "Entrambe le raccolte civiche custodiscono i simboli identitari della città tra arte figurativa e tradizione musicale.",
    },
    {
      targetId: 4,
      tipo_relazione: "Conservazione documentaria",
      motivazione:
        "Così come le mappe dell'Archivio di Stato, gli autografi belliniani preservano la memoria diretta su carta storica.",
    },
  ],
  7: [
    {
      targetId: 4,
      tipo_relazione: "Segno della colata del 1669",
      motivazione:
        "La lava documentata nella pianta del 1669 circondò il fianco del monastero lasciando visibili ancora oggi le pareti di basalto.",
    },
    {
      targetId: 5,
      tipo_relazione: "Palinsesto archeologico",
      motivazione:
        "Le fondamenta del monastero custodiscono testimonianze romane coeve alla grande stagione edilizia dell'Anfiteatro.",
    },
    {
      targetId: 6,
      tipo_relazione: "Quartiere storico delle arti",
      motivazione:
        "A pochi passi dai chiostri benedettini sorge la casa natale di Vincenzo Bellini in Piazza San Francesco.",
    },
  ],
};

function toSummary(detail: OperaDetailOut): OperaSummaryOut {
  const { descrizione_ufficiale: _d, ente: _e, documento_archivio: _doc, ...summary } = detail;
  return summary;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((r * c).toFixed(2));
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function mockFetchOpere(params?: {
  search?: string;
  categoria?: CategoriaOpera | null;
  ente_id?: number | null;
  limit?: number;
  offset?: number;
}): Promise<OperaListResponse> {
  await wait(140);
  const query = (params?.search ?? "").trim().toLowerCase();
  const categoria = params?.categoria ?? null;
  const enteId = params?.ente_id ?? null;
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;

  const filtered = MOCK_OPERE.filter((item) => {
    if (categoria && item.categoria !== categoria) return false;
    if (enteId !== null && item.ente_id !== enteId) return false;
    if (!query) return true;
    return (
      item.titolo.toLowerCase().includes(query) ||
      item.autore.toLowerCase().includes(query) ||
      item.qr_code.toLowerCase().includes(query) ||
      item.breve_sintesi.toLowerCase().includes(query) ||
      item.descrizione_ufficiale.toLowerCase().includes(query) ||
      item.ente_nome.toLowerCase().includes(query) ||
      item.citta.toLowerCase().includes(query) ||
      item.anno.toLowerCase().includes(query)
    );
  });

  return {
    total: filtered.length,
    items: filtered.slice(offset, offset + limit).map(toSummary),
  };
}

export async function mockFetchNearbyOpere(params: {
  lat: number;
  lng: number;
  radius_km?: number;
  categoria?: CategoriaOpera | null;
}): Promise<NearbyResponse> {
  await wait(160);
  const radius = params.radius_km ?? 20;
  const categoria = params.categoria ?? null;

  const computeWithinRadius = (originLat: number, originLng: number): OperaNearbyOut[] =>
    MOCK_OPERE.filter((item) => (!categoria ? true : item.categoria === categoria))
      .map((item) => ({
        ...toSummary(item),
        distance_km: haversineKm(originLat, originLng, item.lat, item.lng),
      }))
      .filter((item) => item.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km);

  const directItems = computeWithinRadius(params.lat, params.lng);
  if (directItems.length > 0) {
    return {
      user_lat: params.lat,
      user_lng: params.lng,
      radius_km: radius,
      fallback_used: false,
      fallback_message: null,
      total: directItems.length,
      items: directItems,
    };
  }

  const fallbackItems = MOCK_OPERE.filter((item) =>
    !categoria ? true : item.categoria === categoria,
  )
    .map((item) => ({
      ...toSummary(item),
      distance_km: haversineKm(CATANIA_LAT, CATANIA_LNG, item.lat, item.lng),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);

  return {
    user_lat: params.lat,
    user_lng: params.lng,
    radius_km: radius,
    fallback_used: true,
    fallback_message:
      `Nessun bene censito entro ${radius} km dalla tua posizione attuale: mostriamo tutti i beni culturali siciliani disponibili.`,
    total: fallbackItems.length,
    items: fallbackItems,
  };
}

export async function mockFetchOperaById(operaId: number): Promise<OperaDetailOut> {
  await wait(90);
  const found = MOCK_OPERE.find((o) => o.id === operaId);
  if (!found) {
    throw new ApiError(
      404,
      "OPERA_NOT_FOUND",
      `Nessun bene culturale trovato con identificativo #${operaId}.`,
    );
  }
  return found;
}

export async function mockFetchOperaByQr(qrCode: string): Promise<OperaDetailOut> {
  await wait(110);
  const normalized = qrCode.trim().toUpperCase();
  const found = MOCK_OPERE.find((o) => o.qr_code.toUpperCase() === normalized);
  if (!found) {
    throw new ApiError(
      404,
      "QR_NOT_FOUND",
      `Il codice QR "${normalized}" non corrisponde ad alcuna opera registrata.`,
    );
  }
  return found;
}

const BASE_ERA_MAP: Record<number, string> = {
  1: "normanno",
  2: "barocco",
  3: "classica",
  4: "barocco",
  5: "classica",
  6: "ottocento",
  7: "barocco",
};

function getOperaEra(operaId: number): string {
  return BASE_ERA_MAP[operaId] ?? SICILY_ERA_MAP[operaId] ?? "classica";
}

function buildDynamicSicilianNarration(
  opera: OperaDetailOut,
  livello: LivelloCompetenza,
): Omit<NarrazioneOut, "opera_id" | "livello" | "from_cache"> {
  const curiosita =
    SICILY_CURIOSITA_MAP[opera.id] ??
    `Questo bene appartiene al patrimonio culturale custodito a ${opera.citta}.`;
  const fonti: string[] = [`Scheda ufficiale Cogito — ${opera.ente.nome}`];
  if (opera.documento_archivio) {
    fonti.push(
      `${opera.documento_archivio.segnatura} (${opera.documento_archivio.datazione})`,
    );
  }

  const archivioNotaBambino = opera.documento_archivio
    ? `\n\nNegli archivi di ${opera.documento_archivio.ente_conservazione} si conserva persino un documento antico intitolato "${opera.documento_archivio.titolo}", che ci racconta da vicino la sua storia.`
    : "";

  const archivioNotaRagazzo = opera.documento_archivio
    ? `\n\nA rendere il racconto ancora più concreto c'è la fonte d'archivio collegata: "${opera.documento_archivio.titolo}" (${opera.documento_archivio.datazione}), custodita presso ${opera.documento_archivio.ente_conservazione}.`
    : "";

  const archivioNotaAdulto = opera.documento_archivio
    ? `\n\nLe testimonianze primarie conservate presso ${opera.documento_archivio.ente_conservazione} (${opera.documento_archivio.segnatura}, ${opera.documento_archivio.datazione}) confermano il contesto di realizzazione e tutela del bene: "${opera.documento_archivio.estratto_verificato}"`
    : `\n\nInserito nel percorso culturale di ${opera.ente.nome} a ${opera.citta}, il bene costituisce una tappa essenziale per leggere le trasformazioni storiche dell'isola.`;

  const archivioNotaEsperto = opera.documento_archivio
    ? `\n\nL'apparato documentario di riscontro (segnatura ${opera.documento_archivio.segnatura}, Fondo ${opera.documento_archivio.fondo}, datato ${opera.documento_archivio.datazione}) attesta espressamente: "${opera.documento_archivio.estratto_verificato}".`
    : `\n\nIl manufatto si integra organicamente nel sistema storico-territoriale di ${opera.citta}, offrendo dati materiali coerenti con la cronologia indicata (${opera.anno}).`;

  switch (livello) {
    case "bambino":
      return {
        testo_lettura: `Partiamo insieme alla scoperta di "${opera.titolo}" a ${opera.citta}! ${opera.breve_sintesi}\n\nRealizzato nel periodo ${opera.anno} (${opera.autore}), oggi è custodito con grande cura presso ${opera.ente.nome}${opera.sala ? `, proprio nello spazio chiamato ${opera.sala}` : ""}. ${curiosita}${archivioNotaBambino}`,
        script_audio: `Partiamo alla scoperta di ${opera.titolo}, a ${opera.citta}. ${opera.breve_sintesi} Risale al periodo ${opera.anno} ed è legato a ${opera.autore}, oggi custodito presso ${opera.ente.nome}. ${curiosita}`,
        curiosita,
        fonti_citate: fonti,
      };
    case "ragazzo":
      return {
        testo_lettura: `A ${opera.citta}, presso ${opera.ente.nome}, si incontra uno dei segni più autentici della storia siciliana: "${opera.titolo}". ${opera.breve_sintesi}\n\nDietro quest'opera del periodo ${opera.anno}, attribuita a ${opera.autore}, c'è una vicenda affascinante fatta di incontri tra culture mediterranee, ingegno artistico e memoria civica. ${curiosita}${archivioNotaRagazzo}`,
        script_audio: `A ${opera.citta}, presso ${opera.ente.nome}, scopriamo ${opera.titolo}. ${opera.breve_sintesi} Risalente a ${opera.anno} e legato a ${opera.autore}, questo bene racconta l'incontro tra le culture del Mediterraneo in Sicilia. ${curiosita}`,
        curiosita,
        fonti_citate: fonti,
      };
    case "adulto":
      return {
        testo_lettura: `${opera.descrizione_ufficiale}${archivioNotaAdulto}`,
        script_audio: `${opera.titolo}, a ${opera.citta}, presso ${opera.ente.nome}. ${opera.descrizione_ufficiale}`,
        curiosita,
        fonti_citate: fonti,
      };
    case "esperto":
      return {
        testo_lettura: `Scheda storico-critica — ${opera.titolo} (${opera.anno}; attribuzione/ambito: ${opera.autore}), sito di conservazione: ${opera.ente.nome}, ${opera.citta}${opera.sala ? ` (${opera.sala})` : ""}.\n\n${opera.descrizione_ufficiale}${archivioNotaEsperto}`,
        script_audio: `Analisi storico-critica di ${opera.titolo}, ${opera.anno}, attribuito a ${opera.autore}, presso ${opera.ente.nome} a ${opera.citta}. ${opera.descrizione_ufficiale}`,
        curiosita,
        fonti_citate: fonti,
      };
  }
}

function buildDynamicRelatedItems(
  source: OperaDetailOut,
  limit: number,
): CorrelazioneItemOut[] {
  const sourceEra = getOperaEra(source.id);
  const sourceCityRoot = source.citta.split("(")[0].split("–")[0].trim().toLowerCase();

  const scored = MOCK_OPERE.filter((cand) => cand.id !== source.id).map((cand) => {
    const candEra = getOperaEra(cand.id);
    const candCityRoot = cand.citta.split("(")[0].split("–")[0].trim().toLowerCase();
    const sameCity = candCityRoot === sourceCityRoot;
    const sameEra = candEra === sourceEra;
    const sameEnte = cand.ente_id === source.ente_id;
    const sameCategory = cand.categoria === source.categoria;

    let score = 0;
    if (sameEnte) score += 50;
    if (sameCity) score += 35;
    if (sameEra) score += 28;
    if (sameCategory) score += 10;
    const dist = haversineKm(source.lat, source.lng, cand.lat, cand.lng);
    score += Math.max(0, 20 - dist * 0.15);

    let tipo_relazione = "Dialogo culturale siciliano";
    let motivazione = `Insieme a "${source.titolo}", "${cand.titolo}" (${cand.citta}) completa il mosaico storico della Sicilia attraverso le collezioni di ${cand.ente_nome}.`;

    if (sameEnte) {
      tipo_relazione = "Medesimo complesso culturale";
      motivazione = `Custodito nello stesso percorso di ${cand.ente_nome} a ${cand.citta}, dialoga direttamente con "${source.titolo}" (${cand.anno}).`;
    } else if (sameCity && sameEra) {
      tipo_relazione = `Stessa stagione a ${source.citta.split("(")[0].trim()}`;
      motivazione = `Appartiene alla medesima fase storica (${cand.anno}) e allo stesso contesto urbano di "${source.titolo}", arricchendo l'itinerario locale.`;
    } else if (sameEra) {
      tipo_relazione = "Affinità storico-artistica";
      motivazione = `Pur trovandosi a ${cand.citta}, "${cand.titolo}" condivide con "${source.titolo}" il clima culturale dell'epoca (${cand.anno}) e ne rispecchia l'evoluzione in Sicilia.`;
    } else if (sameCity) {
      tipo_relazione = `Palinsesto di ${source.citta.split("(")[0].trim()}`;
      motivazione = `Nel medesimo territorio di ${cand.citta}, affianca "${source.titolo}" mostrando la stratificazione dei secoli tra architetture, reperti e archivi.`;
    }

    return { cand, score, tipo_relazione, motivazione };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => ({
    tipo_relazione: entry.tipo_relazione,
    motivazione: entry.motivazione,
    opera: toSummary(entry.cand),
  }));
}

export async function mockFetchOperaNarration(
  operaId: number,
  livello: LivelloCompetenza,
  signal?: AbortSignal,
): Promise<NarrazioneOut> {
  await wait(240, signal);
  const direct = NARRATIONS[operaId]?.[livello];
  if (direct) {
    return {
      opera_id: operaId,
      livello,
      ...direct,
      from_cache: true,
    };
  }

  const opera = MOCK_OPERE.find((o) => o.id === operaId);
  if (!opera) {
    throw new ApiError(
      503,
      "AI_SERVICE_UNAVAILABLE",
      "Generazione narrazione non disponibile al momento.",
    );
  }

  return {
    opera_id: operaId,
    livello,
    ...buildDynamicSicilianNarration(opera, livello),
    from_cache: true,
  };
}

export async function mockFetchOperaRelated(
  operaId: number,
  limit = 3,
  signal?: AbortSignal,
): Promise<CorrelazioniResponse> {
  await wait(220, signal);
  const items = RELATED_MAP[operaId];
  if (items) {
    const correlazioni: CorrelazioneItemOut[] = items
      .slice(0, limit)
      .map((rel) => {
        const target = MOCK_OPERE.find((o) => o.id === rel.targetId);
        if (!target) return null;
        return {
          tipo_relazione: rel.tipo_relazione,
          motivazione: rel.motivazione,
          opera: toSummary(target),
        };
      })
      .filter((x): x is CorrelazioneItemOut => x !== null);

    return {
      opera_sorgente_id: operaId,
      from_cache: true,
      correlazioni,
    };
  }

  const source = MOCK_OPERE.find((o) => o.id === operaId);
  if (!source) {
    return {
      opera_sorgente_id: operaId,
      from_cache: true,
      correlazioni: [],
    };
  }

  return {
    opera_sorgente_id: operaId,
    from_cache: true,
    correlazioni: buildDynamicRelatedItems(source, limit),
  };
}

const OFF_TOPIC_KEYWORDS = [
  "meteo",
  "tempo fa",
  "piove",
  "calcio",
  "partita",
  "ricetta",
  "pasta",
  "pizza",
  "borsa",
  "bitcoin",
  "cripto",
  "equazione",
  "programmazione",
  "python",
  "javascript",
  "biglietto aereo",
  "hotel",
];

export async function mockAskOperaQuestion(
  operaId: number,
  payload: AskRequest,
): Promise<AskResponse> {
  await wait(360);
  const opera = MOCK_OPERE.find((o) => o.id === operaId);
  if (!opera) {
    throw new ApiError(404, "OPERA_NOT_FOUND", "Opera non trovata.");
  }

  const q = payload.question.trim().toLowerCase();
  const isOffTopic = OFF_TOPIC_KEYWORDS.some((kw) => q.includes(kw));

  if (isOffTopic) {
    return {
      opera_id: operaId,
      answer: `La tua domanda non riguarda direttamente "${opera.titolo}" né il suo contesto storico presso ${opera.ente.nome}. Prova a chiedere dell'epoca (${opera.anno}), dell'autore (${opera.autore}) o dei legami con la storia culturale di ${opera.citta}.`,
      in_scope: false,
      fonti_citate: [`Scheda ufficiale: ${opera.titolo}`],
    };
  }

  const fonti: string[] = [`Scheda verificata Cogito (${opera.qr_code}) — ${opera.ente.nome}`];
  if (opera.documento_archivio) {
    fonti.push(`${opera.documento_archivio.segnatura} (${opera.documento_archivio.datazione})`);
  }

  let answer = "";
  if (q.includes("archiv") || q.includes("document") || q.includes("font")) {
    answer = opera.documento_archivio
      ? `Questo bene è collegato a una fonte primaria verificata: "${opera.documento_archivio.titolo}" (${opera.documento_archivio.datazione}), conservata presso ${opera.documento_archivio.ente_conservazione} con segnatura ${opera.documento_archivio.segnatura}.`
      : `Per "${opera.titolo}" non è attualmente collegato un documento cartaceo d'archivio nella scheda catalografica, mentre restano verificati tutti i dati ufficiali di ${opera.ente.nome}.`;
  } else if (q.includes("dove") || q.includes("luogo") || q.includes("orari") || q.includes("visita")) {
    answer = `"${opera.titolo}" si trova presso ${opera.ente.nome} (${opera.ente.indirizzo}, ${opera.ente.citta})${opera.sala ? `, collocato in ${opera.sala}` : ""}. ${opera.ente.orari ? `Orari indicativi di apertura: ${opera.ente.orari}.` : ""}`;
  } else if (q.includes("contesto") || q.includes("stori") || q.includes("quando")) {
    answer = `Risalente al periodo ${opera.anno} e riferito a ${opera.autore}, questo bene riflette una fase decisiva della storia di ${opera.citta}. ${opera.descrizione_ufficiale}`;
  } else {
    const tonePrefix: Record<LivelloCompetenza, string> = {
      bambino: `Ecco la risposta semplice su "${opera.titolo}": `,
      ragazzo: `In breve, su "${opera.titolo}": `,
      adulto: `In merito a "${opera.titolo}": `,
      esperto: `Sulla base dei dati storico-catalografici verificati per "${opera.titolo}": `,
    };
    answer = `${tonePrefix[payload.livello]}${opera.descrizione_ufficiale}`;
  }

  return {
    opera_id: operaId,
    answer,
    in_scope: true,
    fonti_citate: fonti,
  };
}
