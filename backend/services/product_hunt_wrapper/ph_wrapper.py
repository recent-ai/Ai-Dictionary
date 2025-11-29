import requests
from datetime import datetime, timedelta, timezone

'''A wrapper around Product Hunt API to fetch top products based on topics for the previous day.'''

'''NOTE: This still requires further improvements like error handling, formatting the code, adding more topics, and MAJOR is to format the output in a better way.'''

'''Date Check Function to get yesterday's date in required format'''
def date_check():
    """
    Compute the UTC timestamp for the start of the previous day formatted as `YYYY-MM-DDT00:00:00Z`.
    
    Returns:
        str: Date string for yesterday at 00:00:00 UTC in the form `YYYY-MM-DDT00:00:00Z`.
    """
    date_yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    format_date_yesterday = date_yesterday.strftime("%Y-%m-%dT00:00:00Z")
    return format_date_yesterday


'''Function to make URL call to Product Hunt API with the given query and access token'''
def url_call(_query,access_token):
    """
    Send a GraphQL query to the Product Hunt API and return the parsed JSON response.
    
    Parameters:
        _query (str): The GraphQL query string to execute.
        access_token (str): A valid Product Hunt API bearer token.
    
    Returns:
        dict: The JSON-decoded response body from the API.
    
    Raises:
        Exception: If the HTTP response status code is not 200; the exception includes the status code and response text.
    """
    url = "https://api.producthunt.com/v2/api/graphql"
    headers = {
        'Authorization':f"Bearer {access_token}",
        'Content-Type': 'application/json'
    }
    #For Debugging
    # print(date_check())
    body = _query
    response = requests.post(url,headers=headers, json= {"query":body})
    if response.status_code != 200:
        raise Exception(f"Query failed to run with a {response.status_code}.", response.text)
    else:
        print("Query successful !!!🎉")
    
    return response.json()

'''Product Hunt Wrapper Class - contains methods to fetch top products for specific topics'''
class ProductHuntWrapper:
    def __init__(self,access_token):
        """
        Initialize the wrapper with a Product Hunt API access token.
        
        Parameters:
            access_token (str): Product Hunt API bearer token.
        
        Raises:
            ValueError: If `access_token` is missing, not a string, or empty/whitespace.
        """
        if not access_token or not isinstance(access_token, str) or not access_token.strip():
            raise ValueError("Product Hunt access token is required and must be a non-empty string")
        self.access_token = access_token
    
    def get_top_products_topic_ai(self):
        """
        Fetch top Product Hunt posts for the "artificial-intelligence" topic posted after yesterday.
        
        Returns:
            post_list (list[dict]): List of post node dictionaries (each contains fields such as id, name, tagline, createdAt, votesCount, description, reviewsCount, slug, and website). Returns an empty list if no posts are found.
        """
        date_yesterday = date_check()
        query = f"""
                query {{ posts(order: VOTES, featured: true, first: 10, postedAfter: \"{date_yesterday}\", topic: \"artificial-intelligence\") {{ edges {{ node {{ id name tagline createdAt votesCount description reviewsCount slug website }} }} }} }}"""
        
        response = url_call(query,self.access_token)
        items = response.get('data', {}).get('posts', {}).get('edges', [])
        if items is None:
            print("No items found in the response.")
            return []
        post_list = []
        for e in items:
            post_list.append(e.get('node', {}))
        return post_list
            
    def get_top_products_topic_developer_tools(self):
        """
        Fetches top Product Hunt posts for the "developer-tools" topic from the previous day.
        
        Builds and executes a GraphQL query for up to 10 featured posts ordered by votes that were posted after yesterday's UTC date.
        
        Returns:
            list[dict]: A list of post node dictionaries. Each dictionary contains fields such as `id`, `name`, `tagline`, `createdAt`, `votesCount`, `description`, `reviewsCount`, `slug`, and `website`. Returns an empty list if no posts are found.
        """
        date_yesterday = date_check()
        query = f"""
                query {{ posts(order: VOTES, featured: true, first: 10, postedAfter: \"{date_yesterday}\", topic: \"developer-tools\") {{ edges {{ node {{ id name tagline createdAt votesCount description reviewsCount slug website }} }} }} }}"""
        
        response = url_call(query,self.access_token)
        
        items = response.get('data', {}).get('posts', {}).get('edges', [])
        if items is None:
            print("No items found in the response.")
            return []
        post_list = []
        for e in items:
            post_list.append(e.get('node', {}))
        return post_list
    
