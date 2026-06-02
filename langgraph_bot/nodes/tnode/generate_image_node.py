import os
import requests
from dotenv import load_dotenv
from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.utils.prompts import IMAGE_GENERATION_PROMPT


load_dotenv()
BASE_URL = "https://gen.pollinations.ai"


def generate_image(state: State):
    try:
        secret_key = os.getenv("POLLINATIONS_SECRET_KEY")
    except Exception as e:
        print(f"Error fetching Pollinations Secret Key: {e}")
        return {}
    summary = state.get("summary") or state.get("data")
    
    prompt_image = IMAGE_GENERATION_PROMPT.format(summary=summary)

    #API call to Pollinations for image generation
    try:
        response = requests.get(
            f"{BASE_URL}/image/{prompt_image}",
            headers={"Authorization": f"Bearer {secret_key}"},
            params={"model": "gptimage",
                    "quality": "high",
                    "width": 1600,
                    "height": 900
            }
        )
        if response.status_code != 200:
            # print(f"Error occured during Image Generation {response.status_code} - {response.content}")
            raise Exception(f"Error occured during Image Generation {response.status_code} - {response.content}")
        return {"generated_image": response.content}
    except Exception as e:
        print(f"Exception occured {e}")
        