from dotenv import load_dotenv

from langchain.agents import create_agent
from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.models.generativemodel import groqmodel
from langgraph_bot.utils.prompts import DESCRIPTION_PROMPT
load_dotenv()

agent = create_agent(
    model=groqmodel,
    state_schema=State,
    system_prompt=DESCRIPTION_PROMPT,
)
