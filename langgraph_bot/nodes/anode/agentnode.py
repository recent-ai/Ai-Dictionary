from agents.summaryagent import *
from agentschema.stateschema import State
from langchain_core.messages import BaseMessage,HumanMessage


def summary_agent_node(state:State):
    last_message =  f"""Make the summary using the data given below 
    content: 
    Here is the data to summarize = {state['data']} \
    Here is the default title = {state['title']}\
    here is the default topic = {state['topic']}\
    
    keep is professional and easy to understand , cover main important topics to understand it.
    only give summary in the response nothing else.
    """

    response =  agent.invoke({"messages":[HumanMessage(content=last_message)]})

    summary = response["messages"][-1].content
    #  If agent returns a message then append directly
    if isinstance(response, BaseMessage):
        return {"messages": [response],"summary":summary}

    # If agent returns dict with messages then extract them
    if isinstance(response, dict) and "messages" in response:
        return {"messages": response["messages"],"summary":summary}
    return {"messages":[response],"summary":summary}