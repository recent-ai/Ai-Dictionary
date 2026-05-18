from langgraph_bot.agentschema.stateschema import State
from langgraph_bot.tools.tools import slug_tool



def slug_node(state:State):
    title = state.get('title')
    if not title:
        return {}
    slug_res = slug_tool.invoke({"posttitle":title})
    return {"slug":slug_res}
