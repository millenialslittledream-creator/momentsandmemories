import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

from admin.schemas import SaveLayoutRequest, TemplateLayout

_LAYOUTS_PATH = Path(__file__).parent / "layouts.json"
_lock = Lock()


def _read_all() -> dict:
    if not _LAYOUTS_PATH.exists():
        return {}
    try:
        with _LAYOUTS_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def _write_all(data: dict) -> None:
    tmp = _LAYOUTS_PATH.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.replace(_LAYOUTS_PATH)


def list_layouts() -> dict[str, TemplateLayout]:
    raw = _read_all()
    return {k: TemplateLayout(**v) for k, v in raw.items()}


def get_layout(template_id: str) -> Optional[TemplateLayout]:
    raw = _read_all()
    entry = raw.get(template_id)
    return TemplateLayout(**entry) if entry else None


def save_layout(template_id: str, payload: SaveLayoutRequest, annotated_by: str = "admin") -> TemplateLayout:
    with _lock:
        data = _read_all()
        record = TemplateLayout(
            template_id=template_id,
            zones=payload.zones,
            palette=payload.palette,
            updated_at=datetime.now(timezone.utc).isoformat(),
            annotated_by=annotated_by,
        )
        data[template_id] = record.model_dump()
        _write_all(data)
        return record


def delete_layout(template_id: str) -> bool:
    with _lock:
        data = _read_all()
        if template_id not in data:
            return False
        del data[template_id]
        _write_all(data)
        return True
