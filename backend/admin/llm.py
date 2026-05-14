"""LLM client for admin-side suggestions. Supports Anthropic API key (BYO) and
local Ollama. Public read endpoint never calls these — they are admin-only."""
import base64
from typing import Optional

import httpx

# Anthropic SDK is imported lazily so the backend boots even without it.
_DEFAULT_OLLAMA = "http://localhost:11434"
_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"
_OLLAMA_MODEL = "llama3.2-vision"


async def _fetch_image_b64(image_url: str) -> tuple[str, str]:
    """Fetch the image at image_url, return (media_type, base64-data)."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(image_url)
        r.raise_for_status()
        media_type = (r.headers.get("content-type") or "image/jpeg").split(";")[0]
        b64 = base64.standard_b64encode(r.content).decode("ascii")
    return media_type, b64


async def suggest_with_anthropic(api_key: str, image_url: str, prompt: str) -> str:
    """Call Claude Haiku 4.5 with the template image + prompt, return raw text."""
    from anthropic import AsyncAnthropic

    media_type, b64 = await _fetch_image_b64(image_url)
    client = AsyncAnthropic(api_key=api_key)
    msg = await client.messages.create(
        model=_ANTHROPIC_MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )
    # Concatenate text blocks (Haiku may return multiple; usually just one).
    parts = []
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", ""))
    return "".join(parts)


async def suggest_with_ollama(ollama_url: Optional[str], image_url: str, prompt: str) -> str:
    """Call local Ollama with llama3.2-vision, return raw text."""
    base = (ollama_url or _DEFAULT_OLLAMA).rstrip("/")
    _, b64 = await _fetch_image_b64(image_url)
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(
            f"{base}/api/generate",
            json={
                "model": _OLLAMA_MODEL,
                "prompt": prompt,
                "images": [b64],
                "stream": False,
            },
        )
        r.raise_for_status()
        return (r.json().get("response") or "").strip()
