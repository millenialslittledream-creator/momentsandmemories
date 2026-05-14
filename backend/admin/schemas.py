from typing import List, Literal, Optional
from pydantic import BaseModel, Field

# Where this line's text comes from at render time.
TextSource = Literal[
    "literal",            # use `literal_text`
    "celebrant_name",
    "celebrant_possessive",   # "Vedh's"
    "event_label",
    "event_title",
    "host_name",
    "host_possessive",
    "bride_name",
    "groom_name",
    "names_combined",     # bride & groom
    "date_full",
    "date_day_num",
    "date_dow",
    "date_dow_short",
    "date_month",
    "date_month_short",
    "date_year",
    "time",
    "timezone",
    "time_with_tz",
    "venue",
    "rsvp_contact",
    "custom_message",
]

FontFamily = Literal[
    "Italiana",
    "Cormorant Garamond",
    "Playfair Display",
    "Bodoni Moda",
    "Cinzel",
    "DM Serif Display",
    "Abril Fatface",
    "Tenor Sans",
    "Inter",
    "Allura",
    "Great Vibes",
    "Sacramento",
]

TextEffect = Literal["none", "shadow", "gold", "outline"]
CurvePreset = Literal["flat", "arc-up", "arc-down", "wave", "circle"]


class Line(BaseModel):
    text_source: TextSource
    literal_text: Optional[str] = None
    font_family: FontFamily = "Cormorant Garamond"
    font_weight: int = Field(500, ge=100, le=900)
    italic: bool = False
    letter_spacing: float = Field(0.02, ge=-0.1, le=0.5)
    uppercase: bool = False
    color: Optional[str] = None
    size_pct: float = Field(40, gt=0, le=200, description="% of zone height")
    align: Literal["left", "center", "right"] = "center"
    effect: TextEffect = "shadow"
    curve_preset: CurvePreset = "flat"
    curve_amount: float = Field(50, ge=0, le=100)
    max_chars: int = Field(60, gt=0, le=500)


class Point(BaseModel):
    x: float = Field(..., ge=-10, le=110)
    y: float = Field(..., ge=-10, le=110)


class Zone(BaseModel):
    id: str
    # Polygon vertices in % of image dimensions, in clockwise order.
    # At least 3 points required; rectangular zones are just 4-point polygons.
    polygon: List[Point] = Field(..., min_length=3, max_length=24)
    lines: List[Line]


class Palette(BaseModel):
    text_default: str
    text_alts: List[str] = Field(default_factory=list)
    scrim: Optional[str] = None


class TemplateLayout(BaseModel):
    template_id: str
    zones: List[Zone]
    palette: Palette
    updated_at: Optional[str] = None
    annotated_by: Optional[str] = None


class SaveLayoutRequest(BaseModel):
    zones: List[Zone]
    palette: Palette


class LayoutsResponse(BaseModel):
    layouts: dict[str, TemplateLayout]


# ── LLM suggest ─────────────────────────────────────────────────────────
class LLMSuggestRequest(BaseModel):
    provider: Literal["anthropic", "ollama"]
    image_url: str
    prompt: str
    api_key: Optional[str] = None   # only for anthropic
    ollama_url: Optional[str] = None


class LLMSuggestResponse(BaseModel):
    text: str
