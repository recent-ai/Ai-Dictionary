from datetime import datetime, timezone
from typing import Literal

from langchain_core.messages import ToolMessage
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel

from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.models.generativemodel import groqmodel
from langgraph_bot.utils.prompts import TITLE_BLOCK_PROMPT


class TitleBlockMetadata(BaseModel):
    content: str
    tags: list[str]
    difficulty: Literal["beginner", "intermediate", "advanced"]
    estimated_time: str


# LangChain Output Parser for validating and parsing LLM output 
title_block_parser = PydanticOutputParser(pydantic_object=TitleBlockMetadata)


#LEGACY TITLE NODE - NOT USED ANYMORE, keeping for reference until we are sure the new title block node is working well.
def update_title_node(state: State):
    for msg in reversed(state["messages"]):
        if isinstance(msg, ToolMessage) and msg.name == "title_tool":
            return {"title": msg.content}
    return {}


def _fallback_title_block(state: State) -> dict:
    title = state.get("title") or state.get("topic") or "Untitled Post"
    return {
        "content": title,
        "tags": [],
        "difficulty": "beginner",
        "estimated_time": "3 min read",
    }


def generate_title_block_node(state: State):
    """
    Generate frontend TitleBlock metadata while keeping the plain `title`
    string in state for existing DB and slug behavior.
    """
    prompt = TITLE_BLOCK_PROMPT.format(
        posttitle=state.get("title") or state.get("topic") or "",
        postdata=state.get("data") or "",
        format_instructions=title_block_parser.get_format_instructions(),
    )

    # print(f"Prompt for Title Block Node:\n{prompt}") # Debug
    try:
        response = groqmodel.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)
        
        # Attempt to parse the title block metadata, but if it fails, use a fallback
        title_block = title_block_parser.parse(content).model_dump()
    except Exception as exc:
        print(f"Title block generation failed, using fallback: {exc}")
        title_block = _fallback_title_block(state)

    final_title = title_block["content"].strip() or state.get("topic") or "Untitled Post"

    title_block["content"] = final_title
    title_block["date"] = datetime.now(timezone.utc).date().isoformat()
    title_block["author"] = "AI Dictionary Bot"

    return {
        "title": final_title,
        "title_block": title_block,
    }
