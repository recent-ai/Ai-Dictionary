import os
import requests
from dotenv import load_dotenv
from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.utils.prompts import IMAGE_GENERATION_PROMPT
from urllib.parse import quote


load_dotenv()
BASE_URL = "https://gen.pollinations.ai"


def generate_image(state: State):
    
    secret_key = os.getenv("POLLINATIONS_SECRET_KEY")
    if not secret_key:
        print("Pollinations secret key not found. Please set the POLLINATIONS_SECRET_KEY environment variable.")
        return {"generated_image": None}
    
    summary = state.get("summary") or state.get("data")
    
    prompt_image = IMAGE_GENERATION_PROMPT.format(summary=summary)

    #API call to Pollinations for image generation
    try:
        response = requests.get(
            f"{BASE_URL}/image/{quote(prompt_image, safe='')}",
            headers={"Authorization": f"Bearer {secret_key}"},
            params={"model": "gptimage",
                    "quality": "high",
                    "width": 1600,
                    "height": 900
            },
            timeout=60
        )
        content_type = response.headers.get("Content-Type", "")
        if response.status_code != 200 or not content_type.startswith("image/"):
            raise Exception(
                f"Error occured during Image Generation {response.status_code} - {content_type}"
            )
        return {"generated_image": response.content}
    except Exception as e:
        print(f"Exception occured {e}")
        return {"generated_image": None}

        