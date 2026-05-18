from langgraph.graph.message import add_messages, BaseMessage
from langchain_core.documents import Document
import operator
from pydantic import HttpUrl
from typing import Annotated, TypedDict, List, Optional
# from typing_extensions import TypedDict

def replace_reducer(current: str, new: str) -> str:
    """
    Params: 
    current : current value of the field of the state.
    new : new value addded to the state by some other graph to the field.

    In Langgraph when we have to simultanously manipulate state, it cannot be done directly , 
    we have do append operation . if both operation takes place at same time it might be posible to override the current value with none, 
    to overcome this issue, this reducer fucntion is here.
    """
    if new is not None:
        return new
    if current is not None:
        return current
    return ""


def replace_dict_reducer(current: Optional[dict], new: Optional[dict]) -> dict:
    if new is not None:
        return new
    if current is not None:
        return current
    return {}


class State(TypedDict):
    # If you want to keep history of strings, use operator.add
    # If you just want the current value, use 'overwrite'
    user_input: Annotated[str, replace_reducer] 
    slug: Annotated[str, replace_reducer]
    
    # Lists work perfectly with operator.add
    messages: Annotated[list[BaseMessage], add_messages]
    arxiv_urls: Annotated[List[HttpUrl], operator.add]
    documents: Annotated[List[Document], operator.add]
    # These also need reducers if multiple nodes update them at once
    topic: Annotated[Optional[str], replace_reducer]
    title: Annotated[Optional[str], replace_reducer]
    title_block: Annotated[Optional[dict], replace_dict_reducer]
    summary: Annotated[Optional[str], replace_reducer]
    description: Annotated[Optional[str], replace_reducer]
    
    data: Annotated[Optional[str], replace_reducer]
    tavily_search_result: Annotated[Optional[str], replace_reducer]
    code: Annotated[Optional[str], replace_reducer]
