from dotenv import load_dotenv
load_dotenv()
import asyncio
from agentschema.stateschema import State
from langchain.agents import create_agent
from models.generativemodel import  groqmodel
from pprint import pprint as pp
from tools.tools import python_executor
from utils.prompts import CODING_PROMPT



code_agent = create_agent(
        model=groqmodel,
        state_schema=State,
        system_prompt=CODING_PROMPT,
        tools=[python_executor] #scraper_tool will be added soon for web scraping.
)