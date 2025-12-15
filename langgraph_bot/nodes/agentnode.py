from agents.summaryagent import *
from agentschema.stateschema import State


def summary_agent_node(state:State):
    last_message = State['messages'][-1] + state['data']
    return agent.invoke(last_message)
