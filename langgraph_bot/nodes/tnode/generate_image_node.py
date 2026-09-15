"""This would be replaced as pollitions dont offer free pollens even on hourly
basis as of now - Need a new image gen model. Would mostly throw error here
Potential options - cloudflare Image gen worker 
"""

import logging
import os
from urllib.parse import quote

import requests
from dotenv import load_dotenv

from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.utils.prompts import IMAGE_GENERATION_PROMPT
from langgraph_bot.utils.ratelimit import pollinations_limiter

load_dotenv()
logger = logging.getLogger(__name__)

BASE_URL = "https://gen.pollinations.ai"

# gptimage at 1600x900 / quality=high regularly takes over a minute; the old 60s read
# timeout meant most posts silently ended up with image_url = NULL.
IMAGE_TIMEOUT_SECONDS = 180


def generate_image(state: State):
    secret_key = os.getenv("POLLINATIONS_SECRET_KEY")
    if not secret_key:
        logger.warning("Pollinations secret key not found; set POLLINATIONS_SECRET_KEY")
        return {"generated_image": None}

    summary = state.get("summary") or state.get("data")
    prompt_image = IMAGE_GENERATION_PROMPT.format(summary=summary)

    try:
        pollinations_limiter.acquire()
        response = requests.get(
            f"{BASE_URL}/image/{quote(prompt_image, safe='')}",
            headers={"Authorization": f"Bearer {secret_key}"},
            params={
                "model": "gptimage",
                "quality": "high",
                "width": 1600,
                "height": 900,
            },
            timeout=IMAGE_TIMEOUT_SECONDS,
        )
        content_type = response.headers.get("Content-Type", "")
        if response.status_code != 200 or not content_type.startswith("image/"):
            raise RuntimeError(
                f"image generation failed: {response.status_code} - {content_type}"
            )
        return {"generated_image": response.content}
    except Exception:
        logger.exception("generate_image: image generation failed")
        return {"generated_image": None}
