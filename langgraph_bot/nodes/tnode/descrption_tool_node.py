from agentschema.stateschema import State
from langchain_core.messages import ToolMessage
from tools.tools import arxiv_tool,tavily_search_tool,pdfreader_tool

def update_arxiv(state:State):
    for msg in reversed(state['messages']):
        if isinstance(msg,ToolMessage) and msg.name == "ARXIV_TOOL":
             return {
                "arxiv_urls": msg.content
                }
    return {}

def update_tavily_result(state:State):
    for msg in reversed(state['messages']):
        if isinstance(msg,ToolMessage) and msg.name == "tavily_search":
            return {
                "tavily_search_result": msg.content
            }
