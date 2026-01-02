from agentschema.stateschema import State
from langchain_core.messages import HumanMessage
from langgraph.graph import START,StateGraph,END
from langgraph.prebuilt import ToolNode
from nodes.anode.agentnode import description_agent_node
from nodes.tnode.descrption_tool_node import arxiv_node,pdf_parsing_node,tavily_node
from nodes.load_data_node import load_data
from tools.tools import title_tool
import pprint


desc = StateGraph(state_schema= State)
desc.add_node("load_data",load_data)
desc.add_node("description_agent",description_agent_node)
desc.add_node("arxiv_node",arxiv_node)
desc.add_node("parser_tool",pdf_parsing_node)
desc.add_node("tavily_tool",tavily_node)


desc.set_entry_point("load_data")
desc.add_edge("load_data","arxiv_node")
desc.add_edge("load_data","parser_tool")
desc.add_edge("load_data","tavily_tool")
desc.add_edge("tavily_tool","description_agent")
desc.add_edge("parser_tool","description_agent")
desc.add_edge("arxiv_node","description_agent")
desc.add_edge("description_agent",END)
g = desc.compile()



inputs = {
    "messages": [],
}

final_state =g.invoke(inputs)


for msg in final_state:
    print("------------------------------------------")
    print(msg)
    print("------------------------------------------")
    if msg == "arxiv_urls":
        print(final_state[msg][0]["abstract"])
        print()
    if msg == "tavily_search_result":
      i = 0
      for result in final_state[msg]['results']:
        print(f"result {i}")
        i+=1
        print(result['content'])
        # print(result['url'])
        print()
    if msg == "description":
      print("==================================================================================================================================")
      print(final_state[msg])
      print("==================================================================================================================================")
      print()



g.get_graph().draw_mermaid_png(output_file_path='./agent_flow_diagrams/description.png')