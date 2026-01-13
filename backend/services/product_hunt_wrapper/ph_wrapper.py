"""Product Hunt API v2 GraphQL wrapper.

This module provides a wrapper for the Product Hunt API v2 using GraphQL to fetch
top products filtered by specific topics from the previous day.

Authentication:
    Requires a valid Product Hunt API access token (Bearer token).
    Generate tokens at: https://www.producthunt.com/v2/oauth/applications

Functionality:
    - Fetches top 10 products ordered by votes for the previous day
    - Supports filtering by specific topics
    - Returns product details including name, tagline, description, votes, and more

Supported Topics:
    - AI (Artificial Intelligence)
    - Developer Tools

Note:
    This module requires further improvements including enhanced error handling,
    code formatting improvements, additional topic support, and better output
    formatting.

    Another addition to the note is this requires more scraping/crawling to get more
    data for the product
    We could use FireCrawler(Again 🤔)
       - Probably using /crawl endpoint - Provides multiple JSON outputs
        for different data points
       - /agent endpoint(5 runs daily limit)-Providing links and nicely written prompts
        Ex - https://pickey.ai/?ref=producthunt
        This is a AI product from Product Hunt
        Extract, Scrape and Crawl the whole website and provide as
        much information as you can for the website. We want to write a blog for
        this product explaining the product in a structured way and humane
        format with examples of tools on usage, doc references, Code Examples .etc.
        I want all accurate information about the product. Don't assume and
        provide inaccurate information Structure the output in a such a way
        that we are writing a blog page for this product having - Title, Summary(small),
        Description( Full Explanation detailed), Code Examples/ Docs, Links, End
"""

from datetime import UTC, datetime, timedelta

import requests


def date_check():
    """Return yesterday's date in ISO 8601 format.

    Returns:
        str: Yesterday's date at midnight (00:00:00) in UTC, formatted as
            'YYYY-MM-DDTHH:MM:SSZ'.
    """
    date_yesterday = datetime.now(UTC) - timedelta(days=1)
    format_date_yesterday = date_yesterday.strftime("%Y-%m-%dT00:00:00Z")
    return format_date_yesterday


def url_call(_query, access_token):
    """Execute a GraphQL query against the Product Hunt API v2.

    Args:
        _query (str): The GraphQL query string to execute.
        access_token (str): The Product Hunt API access token for authentication.

    Returns:
        dict: JSON response from the API containing the query results.

    Raises:
        Exception: If the API request fails with a non-200 status code.
    """
    url = "https://api.producthunt.com/v2/api/graphql"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    # For Debugging
    # print(date_check())
    body = _query
    response = requests.post(url, headers=headers, json={"query": body})
    if response.status_code != 200:
        raise Exception(
            f"Query failed to run with a {response.status_code}.", response.text
        )
    else:
        print("Query successful !!!🎉")

    return response.json()


class ProductHuntWrapper:
    """Main API wrapper for Product Hunt with topic-filtered product fetching.

    This class provides methods to fetch top products from Product Hunt API
    filtered by specific topics for the previous day.
    """

    def __init__(self, access_token):
        """Initialize the ProductHuntWrapper with an access token.

        Args:
            access_token (str): Valid Product Hunt API access token. Must be a
                non-empty string.

        Raises:
            ValueError: If access_token is None, not a string, or empty/whitespace only.
        """
        if (
            not access_token
            or not isinstance(access_token, str)
            or not access_token.strip()
        ):
            raise ValueError(
                "Product Hunt access token is required and must be a non-empty string"
            )
        self.access_token = access_token

    def get_top_products_by_topic(self, topic: str, limit: int = 10):
        """Retrieve top products from the previous day filtered by topic.

        Fetches featured products from the specified topic,
        ordered by votes count, posted within the previous day.

        Args:
            topic (str): The Product Hunt topic slug to filter by
                (e.g., 'artificial-intelligence', 'developer-tools').
            limit (int, optional): Maximum number of products to retrieve.
                Defaults to 10.

        Returns:
            list: List of dictionaries containing product details including id, name,
                tagline, createdAt, description, slug, website, url, and comments.
                Returns empty list if no products found.

        Raises:
            ValueError: If topic is None, not a string, or empty/whitespace only .
                        or if limit is less than or equal to zero.

        Example:
            >>> wrapper = ProductHuntWrapper(access_token="your_token")
            >>> # Get AI products
            >>> ai_products=wrapper.get_top_products_by_topic("artificial-intelligence")
            >>> # Get Developer Tools products
            >>> dev_tools = wrapper.get_top_products_by_topic("developer-tools")
            >>> # Get custom number of products
            >>> products= wrapper.get_top_products_by_topic("developer-tools", limit=20)
        """
        if not topic or not isinstance(topic, str) or not topic.strip():
            raise ValueError("Topic is required and must be a non-empty string")
        if limit <= 0:
            raise ValueError("Limit must be a positive integer")

        date_yesterday = date_check()
        query = f"""
                query {{ 
                    posts(
                        order: VOTES, 
                        featured: true, 
                        first: {limit}, 
                        postedAfter: \"{date_yesterday}\", 
                        topic: \"{topic}\"
                    ) {{ 
                        edges {{ 
                            node {{ 
                                id 
                                name 
                                description 
                                slug 
                                website 
                                tagline 
                                createdAt
                                url
                                comments(first: 2) {{
                                    nodes {{
                                        id
                                        body
                                        createdAt
                                        url
                                        votesCount
                                        user {{
                                        id
                                        name
                                        username
                                        }}
                                    }}
                                }}  
                            }} 
                        }} 
                    }} 
                }}"""

        response = url_call(query, self.access_token)
        items = response.get("data", {}).get("posts", {}).get("edges", [])
        if items == []:
            print("No items found in the response.")
            return []

        return [edge.get("node", {}) for edge in items]
