from agentschema.stateschema import State
from langgraph.graph import START,StateGraph,END
from nodes.agentnode import summary_agent_node


graph_builder = StateGraph()
graph_builder.add_node("summary_agent",summary_agent_node)
graph_builder.add_edge(START,"summary_agent")
graph_builder.add_edge("summary_agent",END)
graph = graph_builder.compile()





