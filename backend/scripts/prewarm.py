import argparse
from pathlib import Path
import sys
import time
from typing import Optional

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.genai_client import get_genai_client
from app.models import LivelloCompetenza, Opera
from app.services.adaptive_narration_service import get_narration
from app.services.correlation_service import get_related_opere


def prewarm(
    limit: int,
    delay_seconds: float,
    qr_codes: Optional[list[str]] = None,
) -> None:
    """Pre-popola narrazioni (4 livelli) e correlazioni per le opere selezionate."""
    genai_client = get_genai_client()
    levels = list(LivelloCompetenza)

    with SessionLocal() as db:
        if qr_codes:
            normalized = [code.strip().upper() for code in qr_codes if code.strip()]
            stmt = select(Opera).where(Opera.qr_code.in_(normalized)).order_by(Opera.id)
        else:
            stmt = select(Opera).order_by(Opera.id).limit(limit)

        opere = db.execute(stmt).scalars().all()
        print(f"Avvio pre-warming su {len(opere)} opere (4 livelli + correlazioni)...")

        for idx, opera in enumerate(opere, start=1):
            print(f"\n[{idx}/{len(opere)}] {opera.qr_code} — {opera.titolo}")

            for livello in levels:
                try:
                    res = get_narration(db, genai_client, opera.id, livello)
                    stato = "CACHE HIT" if res.from_cache else "GENERATA"
                    print(f"  - narration ({livello.value}): {stato} | fonti: {len(res.fonti_citate)}")
                    if not res.from_cache and delay_seconds > 0:
                        time.sleep(delay_seconds)
                except Exception as exc:
                    print(f"  ! ERRORE narration ({livello.value}): {exc}")

            try:
                rel = get_related_opere(db, genai_client, opera.id, limit=3)
                stato = "CACHE HIT" if rel.from_cache else "GENERATA"
                print(f"  - related: {stato} | {len(rel.correlazioni)} correlazioni")
                if not rel.from_cache and delay_seconds > 0:
                    time.sleep(delay_seconds)
            except Exception as exc:
                print(f"  ! ERRORE related: {exc}")

    print("\nPre-warming completato.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pre-warming cache AI di Cogito")
    parser.add_argument("--limit", type=int, default=15, help="Numero di opere da pre-riscaldare")
    parser.add_argument("--delay", type=float, default=4.5, help="Pausa in secondi tra chiamate Gemini")
    parser.add_argument(
        "--qr",
        nargs="+",
        default=None,
        help="Codici QR specifici da pre-riscaldare (es. COG-046 COG-088)",
    )
    args = parser.parse_args()
    prewarm(limit=args.limit, delay_seconds=args.delay, qr_codes=args.qr)