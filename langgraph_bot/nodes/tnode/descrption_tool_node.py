from agentschema.stateschema import State
from langchain_core.messages import ToolMessage
from tools.tools import arxiv_tool,tavily_search_tool,pdfreader_tool

def arxiv_node(state: State):
    papers = arxiv_tool.invoke(state["title"])

    return {
        "arxiv_urls": papers,   # directly into state
        "messages": [
            ToolMessage(
                tool_name="ARXIV_TOOL",
                content=str(papers)
            )
        ]
    }


def tavily_node(state: State):
    result = tavily_search_tool.invoke({
        "query": state["title"]
    })

    return {
        "tavily_search_result": result
    }

        
def pdf_parsing_node(state:State):

    # Safety check
    papers = state.get("arxiv_urls")
    if not papers:
        return {}

    papers_to_read = papers[:4] #using top 4 pdfs only

    docs = pdfreader_tool.invoke(papers_to_read)

    return {
        "documents": docs
    }

