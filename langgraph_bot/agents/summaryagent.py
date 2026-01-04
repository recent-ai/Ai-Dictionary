from dotenv import load_dotenv
load_dotenv()
from models.generativemodel import model, aimodel, groqmodel
from langchain.agents import create_agent
from utils.prompts import SUMMARY_PROMPT
from agentschema.stateschema import State
from pprint import pprint as pp
from tools.tools import title_tool



s_agent = create_agent( # s refers to summary
        model=groqmodel,
        state_schema=State,
        system_prompt=SUMMARY_PROMPT,
        tools=[title_tool]
)



# # response = agent.invoke({"messages":text})
# # res = agent.invoke({"messages":text})
# # print(res)


