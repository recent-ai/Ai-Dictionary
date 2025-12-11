from langgraph_bot.models.generativemodel import model,aimodel
from langchain.agents import create_agent
from langgraph_bot.utils.prompts import SUMMARY_PROMPT
from langgraph_bot.agentschema.stateschema import State
from dotenv import load_dotenv
load_dotenv()


text = input("enter query: ")
agent = create_agent(
        model=model,
        system_prompt=SUMMARY_PROMPT,
)

# response = agent.invoke({"messages":text})
# res = agent.invoke({"messages":text})
# print(res)


inputs = {"messages": [{"role": "user", "content": text}]}
for chunk in agent.stream(inputs, stream_mode="updates"):
        print(chunk)