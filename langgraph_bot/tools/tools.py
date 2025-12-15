from models.generativemodel import groqmodel
from utils.prompts import TITLE_PROMPT
from langchain_core.tools import  tool
postdata= "demo"
posttitle ="demo"


@tool
def title_tool():
    """
    name :titile_tool
    work : generates title from the given data, or the existing title.
    
    - if no title is given then generate the title around 5 words
    - if the lenght of  the original title exceeds 8 words and doesn't contain minimum 4 words.
    -      for large title more than 8
    -        make it to nearly 8 or 7 with professional flow
    -      for small title less than 4 
    -        make it large to around 7 words with professional flow

    after doing all the process return only new title in string format.without anything extra.
    """
    final_prompt = TITLE_PROMPT.format(postdata = postdata,posttitle =posttitle )
    response = groqmodel.invoke(final_prompt)
    print(response.content.strip())
    return response.content.strip()
