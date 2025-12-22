from dotenv import load_dotenv
load_dotenv()
from agentschema.stateschema import State
from typing import Optional
from models.generativemodel import groqmodel
from utils.prompts import TITLE_PROMPT
from langchain.tools import  tool,ToolRuntime
from langchain.messages import ToolMessage
from langgraph.types import Command


@tool
def title_tool(posttitle:str,postdata:str):
    """
    name :title_tool
    work : generates title from the given data, or the existing title.
    
    - if no title is given then generate the title around 5 words
    - if the length of  the original title exceeds 8 words or doesn't contain minimum 4 words.
    -      for large title more than 8
    -        make it to nearly 8 or 7 with professional flow
    -      for small title less than 4 
    -        make it large to around 7 words with professional flow

    after doing all the process return only new title in string format.without anything extra.
    """
    final_prompt = TITLE_PROMPT.format(postdata = postdata,posttitle=posttitle )
    response = groqmodel.invoke(final_prompt)
    return response.content.strip()


@tool
def tavily_tool():
    """
    NAME : TAVILY TOOL
    WORK : it is useful to access the internet and serach the unknown terms new to the agent.
           if agent don't know anything which has came very recent it's very helpful for the agent to understand new term.
           you can search specific term or query. it will reaturn the meaning or the description to understand a term or query.

    
    """
    pass
@tool
def pdfreader_tool():
    """
    NAME : PDFREADER_TOOL
    WORK : It is used to read from the pdfs. it loads the data from the pdfs and you can read from it for better understanding.
           it will be mostly used to read some newly published articals or the existing ones from gathering necessory infromation for post generation.

    """
    pass

@tool
def arxiv_tool():
    """
    NAME : ARXIV_TOOL
    WORK : It is used to fetch the pdfs from the arxiv platform. it will be userful to load the pdfs from the arxiv website.
            the newly published researches will be found using this tool.to find new topics  or if some topic require prior konwledge which llm or agent doesn't have 
            and it's research paper if available you can make a query or search to find those document and read from it to understand and generate better understanding post.
            so the new person in ai domain can understand better.
    """
    pass

@tool
def scraper_tool():
    """
    NAME : SCAPER_TOOL
    WORK : It is used to scarp from the web.
           it scrapes data from the websites like W3Schools,medium,geeksforgeeks blogs,producthunt blogs,deepmind blogs,openai blogs,antropic blogs,TechCrunch etc.
           you scrap the data build the knowledge fully by reading from it and generate meaningfull technical understadable blog/post.
    """
    pass