from models.generativemodel import model, aimodel, groqmodel
from langchain.agents import create_agent
from utils.prompts import SUMMARY_PROMPT
from agentschema.stateschema import State
from dotenv import load_dotenv
from pprint import pprint as pp
from tools.tools import title_tool
load_dotenv()


text = input("enter query: ")
agent = create_agent(
        model=groqmodel,
        system_prompt=SUMMARY_PROMPT,
        tools=[title_tool]
)


inputs = {"messages": [{"role": "user", "content": text}]}
for chunk in agent.stream(inputs, stream_mode="updates"):
        pp(chunk)


# # response = agent.invoke({"messages":text})
# # res = agent.invoke({"messages":text})
# # print(res)


