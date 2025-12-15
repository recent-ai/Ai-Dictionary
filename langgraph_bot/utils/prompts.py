SUMMARY_PROMPT = """
        You are an SUMMARY EXPERT .
            create a breif summary explaining the topics given in {text} and write it in very basic terms to anyone can understand it.

"""

TITLE_PROMPT = """
    your are given a task to generate title of the {postdata}

    follow these rules for making or editing the title  :

        - here is the actual title {posttitle}
        - give the title within the range from 5-7 words
        - make this title more professional and related to content within the post.
        - if it's too large around 10 words then bring it to 7 words
"""