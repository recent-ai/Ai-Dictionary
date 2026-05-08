from pathlib import Path
import pprint

from langchain_core.messages import HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.nodes.anode.agentnode import summary_agent_node
from langgraph_bot.nodes.load_data_node import load_data
from langgraph_bot.nodes.tnode.title_node import update_title_node
from langgraph_bot.nodes.tnode.slug_update_node import slug_node
from langgraph_bot.tools.tools import title_tool

graph_builder = StateGraph(state_schema=State)
# graph_builder.add_node("load_data", load_data)
graph_builder.add_node("summary_agent", summary_agent_node)
graph_builder.add_node("title_tool_node", ToolNode([title_tool]))
graph_builder.add_node("title_update", update_title_node)
graph_builder.add_node("slug_node",slug_node)


graph_builder.add_edge(START, "summary_agent")
graph_builder.add_edge("summary_agent", "title_tool_node")
graph_builder.add_edge("title_tool_node", "title_update")
graph_builder.add_edge("title_update", "slug_node")
graph_builder.add_edge("slug_node",END)
graph = graph_builder.compile()



def write_graph_summarygraph_png() -> Path:
    """
        Write the compiled graph diagram to `langgraph_bot/agent_flow_diagrams/summaryagent.png`.
        Ensures the output directory exists
    """
    out_dir = Path(__file__).resolve().parents[1] / "agent_flow_diagrams"

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "summaryagent.png"
    graph.get_graph().draw_mermaid_png(output_file_path=str(out_path))
    return out_path