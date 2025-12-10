from typing import Annotated,TypedDict,List,Union,Optional



class State(TypedDict):
    user_input:Optional[Union[str,list]]
    data:Optional[str]
    topic:Optional[str]
    title:Optional[str]
    summary:Optional[str]
    code:Optional[str]

    
    

    
