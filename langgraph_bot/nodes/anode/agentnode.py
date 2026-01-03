from agents.description_agent import agent
from agents.summaryagent import s_agent
from agentschema.stateschema import State
from langchain_core.messages import BaseMessage,HumanMessage,AIMessage


def summary_agent_node(state:State):
    last_message =  f"""Make the summary using the data given below 
    content: 
    Here is the data to summarize = {state['data']} 
    Here is the default title = {state['title']}
    Here is the default topic = {state['topic']}
    """
    response =  s_agent.invoke({"messages":[HumanMessage(content=last_message)]})

    # If agent returns dict with messages then extract them
    if isinstance(response, dict) and "messages" in response:
        summary = response["messages"][-1].content
        return {"messages": response["messages"],"summary":summary}
    return {"messages":[response],"summary":summary}

def description_agent_node(state:State):
    last_message = f"""
    Generate a comprehensive technical description using the following information:
    
    Data: {state['data']}
    Search results from internet: {state['tavily_search_result']}
    
    Provide a detailed, well-structured description that combines insights from both sources.
    """

    response = agent.invoke({"messages":[HumanMessage(content=last_message)]})

    try:
        if response:
            if isinstance(response,dict) and "messages" in response:
                description = response['messages'][-1].content
                return {"messages":response["messages"],"description":description,"description_agent_success":True}
    except Exception as e:
        return {"messages":[AIMessage(content=f"the agent can not perform this action due to error {e}")],"description_agent_success":False}




