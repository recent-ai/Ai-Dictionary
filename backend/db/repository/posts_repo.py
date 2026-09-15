from backend.db.client import supabase

# Repository functions for the flat `posts` table.
# The redesign migration dropped `post_content` and the create_post_with_content
# RPC, so the helpers that wrapped them are gone; add new ones in this pattern.


def get_post_by_id(post_id: str):
    """
    Docstring for get_post_by_id

    :param post_id: Description
    :type post_id: str
    """
    try:
        post = supabase.table("posts").select("*").eq("id", post_id).execute()

        if post.error:
            raise Exception(f"Error fetching post by id: {post.error.message}")

        return post.data

    except Exception as e:
        raise Exception(f"Exception in get_post_by_id: {str(e)}") from e


def user_liked_post(user_id: str, post_id: str):
    """
    Docstring for user_liked_post

    :param user_id: Description
    :type user_id: str
    :param post_id: Description
    :type post_id: str
    """

    # Todo : Need to add Primary key constraint on (userid, likedpostid)
    # in supabase table to avoid duplicate likes
    try:
        res = (
            supabase.table("user_liked_posts")
            .insert({"userid": user_id, "likedpostid": post_id})
            .execute()
        )

        if res.error:
            # Check if it's a duplicate key constraint violation
            if (
                "duplicate" in str(res.error).lower()
                or "unique constraint" in str(res.error).lower()
            ):
                return False  # Already liked
            raise Exception(f"Error recording like: {res.error.message}")

        return True

    except Exception as e:
        raise Exception(f"Exception in user_liked_post: {str(e)}") from e
