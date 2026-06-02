from pathlib import Path

from langgraph.graph import END, START, StateGraph

from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.nodes.anode.agentnode import summary_agent_node
from langgraph_bot.nodes.tnode.title_node import generate_title_block_node
from langgraph_bot.nodes.tnode.slug_update_node import slug_node
from langgraph_bot.nodes.tnode.generate_image_node import generate_image

graph_builder = StateGraph(state_schema=State)
# graph_builder.add_node("load_data", load_data)
graph_builder.add_node("generate_title_block", generate_title_block_node)
graph_builder.add_node("summary_agent", summary_agent_node)
graph_builder.add_node("slug_node",slug_node)
graph_builder.add_node("image_generation_node",generate_image)


graph_builder.add_edge(START, "generate_title_block")
graph_builder.add_edge("generate_title_block", "slug_node")
graph_builder.add_edge("slug_node", "summary_agent")
graph_builder.add_edge("summary_agent","image_generation_node")
graph_builder.add_edge("image_generation_node", END)
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
