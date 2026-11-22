import json
from pathlib import Path
import re
import subprocess
import sys

# Garantisce che `from app...` funzioni da qualsiasi cartella lanci lo script
BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import (
    CategoriaOpera,
    DocumentoArchivio,
    EnteLuogo,
    Opera,
    TipologiaEnte,
)

CATALOG_TS_PATH = ROOT_DIR / "frontend" / "src" / "services" / "sicilyMockCatalog.ts"

# Mappa i motif del catalogo ai 7 SVG reali in frontend/public/images/ (< 40 char)
MOTIF_TO_IMAGE: dict[str, str] = {
    "castle": "/images/castello-ursino.svg",
    "painting": "/images/martirio-sant-agata.svg",
    "mosaic": "/images/martirio-sant-agata.svg",
    "sculpture": "/images/torso-imperatore.svg",
    "artifact": "/images/torso-imperatore.svg",
    "map": "/images/pianta-1669.svg",
    "theater": "/images/anfiteatro-romano.svg",
    "temple": "/images/anfiteatro-romano.svg",
    "manuscript": "/images/partitura-norma.svg",
    "cathedral": "/images/monastero-benedettini.svg",
    "baroque": "/images/monastero-benedettini.svg",
    "fountain": "/images/monastero-benedettini.svg",
}


def load_sicily_catalog() -> dict:
    """Estrae SICILY_ENTI e SICILY_SEED_ITEMS da sicilyMockCatalog.ts tramite Node."""
    src = CATALOG_TS_PATH.read_text(encoding="utf-8")

    enti_match = re.search(r"export const SICILY_ENTI:[^=]+=\s*(\{.*?\n\});", src, flags=re.S)
    items_match = re.search(r"const SICILY_SEED_ITEMS:[^=]+=\s*(\[.*?\n\]);", src, flags=re.S)
    if not enti_match or not items_match:
        raise RuntimeError("Impossibile estrarre SICILY_ENTI o SICILY_SEED_ITEMS dal file TS.")

    js_code = (
        f"const enti = ({enti_match.group(1)});\n"
        f"const items = ({items_match.group(1)});\n"
        "console.log(JSON.stringify({ enti, items }));\n"
    )
    raw_json = subprocess.check_output(["node", "-e", js_code], text=True)
    return json.loads(raw_json)


def seed_database() -> None:
    """Popola enti_luoghi, archivi_documenti e opere in modo idempotente."""
    data = load_sicily_catalog()

    with SessionLocal() as db:
        enti_by_name = {
            ente.nome: ente
            for ente in db.execute(select(EnteLuogo)).scalars().all()
        }
        enti_by_ts_id: dict[int, EnteLuogo] = {}
        nuovi_enti = 0

        # 1. Inserimento enti (idempotente per nome)
        for ts_id_str, e_data in data["enti"].items():
            ente = enti_by_name.get(e_data["nome"])
            if ente is None:
                ente = EnteLuogo(
                    nome=e_data["nome"],
                    tipologia=TipologiaEnte(e_data["tipologia"]),
                    indirizzo=e_data["indirizzo"],
                    citta=e_data["citta"],
                    lat=e_data["lat"],
                    lng=e_data["lng"],
                    orari=e_data.get("orari"),
                    sito_web=e_data.get("sito_web"),
                )
                db.add(ente)
                db.flush()
                enti_by_name[ente.nome] = ente
                nuovi_enti += 1
            enti_by_ts_id[int(ts_id_str)] = ente

        docs_by_segnatura = {
            doc.segnatura: doc
            for doc in db.execute(select(DocumentoArchivio)).scalars().all()
        }
        opere_by_qr = {
            opera.qr_code: opera
            for opera in db.execute(select(Opera)).scalars().all()
        }
        nuovi_doc = 0
        nuove_opere = 0

        # 2. Inserimento documenti d'archivio + opere (idempotente per segnatura e qr_code)
        for item in data["items"]:
            opera_ente = enti_by_ts_id[item["ente_id"]]
            doc_id = None
            doc_data = item.get("documento_archivio")

            if doc_data:
                doc = docs_by_segnatura.get(doc_data["segnatura"])
                if doc is None:
                    arch_name = doc_data["ente_conservazione"]
                    arch_ente = enti_by_name.get(arch_name)
                    if arch_ente is None:
                        arch_ente = EnteLuogo(
                            nome=arch_name,
                            tipologia=TipologiaEnte.ARCHIVIO,
                            indirizzo=opera_ente.indirizzo,
                            citta=opera_ente.citta,
                            lat=opera_ente.lat,
                            lng=opera_ente.lng,
                        )
                        db.add(arch_ente)
                        db.flush()
                        enti_by_name[arch_name] = arch_ente
                        nuovi_enti += 1

                    doc = DocumentoArchivio(
                        ente_id=arch_ente.id,
                        segnatura=doc_data["segnatura"],
                        fondo=doc_data["fondo"],
                        titolo=doc_data["titolo"],
                        datazione=doc_data["datazione"],
                        estratto_verificato=doc_data["estratto_verificato"],
                        immagine_url=MOTIF_TO_IMAGE.get(
                            item.get("motif", ""), "/images/pianta-1669.svg"
                        ),
                    )
                    db.add(doc)
                    db.flush()
                    docs_by_segnatura[doc.segnatura] = doc
                    nuovi_doc += 1
                doc_id = doc.id

            qr_code = item["qr_code"].strip().upper()
            if qr_code not in opere_by_qr:
                opera = Opera(
                    qr_code=qr_code,
                    titolo=item["titolo"],
                    autore=item["autore"],
                    anno=item["anno"],
                    categoria=CategoriaOpera(item["categoria"]),
                    sala=item.get("sala"),
                    breve_sintesi=item["breve_sintesi"],
                    descrizione_ufficiale=item["descrizione_ufficiale"],
                    immagine_url=MOTIF_TO_IMAGE.get(
                        item.get("motif", ""), "/images/castello-ursino.svg"
                    ),
                    ente_id=opera_ente.id,
                    documento_archivio_id=doc_id,
                    lat=item.get("lat"),
                    lng=item.get("lng"),
                )
                db.add(opera)
                opere_by_qr[qr_code] = opera
                nuove_opere += 1

        db.commit()
        print(
            f"Seed completato! Inseriti: {nuovi_enti} enti, "
            f"{nuovi_doc} documenti d'archivio, {nuove_opere} opere."
        )


if __name__ == "__main__":
    seed_database()