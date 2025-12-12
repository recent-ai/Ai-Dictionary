from agentschema.stateschema import State
from langgraph.graph import START,StateGraph,END
from nodes.agentnode import summary_agent_node


graph = StateGraph()

graph.add_node(START)
graph.add_node(summary_agent_node)
graph.add_node(END)



graph.compile()