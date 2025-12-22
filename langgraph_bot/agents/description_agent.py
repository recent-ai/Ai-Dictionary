from dotenv import load_dotenv
load_dotenv()
import asyncio
from agentschema.stateschema import State
from langchain.agents import create_agent
from models.generativemodel import  groqmodel
from pprint import pprint as pp
from tools.tools import arxiv_tool,tavily_search_tool,pdfreader_tool,scraper_tool
from utils.prompts import DESCRIPTION_PROMPT



agent = create_agent(
        model=groqmodel,
        state_schema=State,
        system_prompt=DESCRIPTION_PROMPT,
        tools=[arxiv_tool,tavily_search_tool,pdfreader_tool,scraper_tool]
)


    