from backend.db.client import supabase
from datetime import datetime
import uuid


def insert_cleaned_data(posts: list):
    total = len(posts)
    failed = 0
    inserted = 0

    for post in posts:
        try:
            post_id = str(uuid.uuid4())
            uploaded_image_path = None  # track in outer scope so both handlers can reference it

            post_data = {
                "postid": post_id,
                "title": post.get("title"),
                "source": post.get("source"),
                "upload_date": datetime.utcnow().isoformat(),
                "approveddate": datetime.utcnow().isoformat(),
                "likescount": 0,
            }

            supabase.table("posts").insert(post_data).execute()

            image_url = None
            try:
                image_data = post.get("generated_image")

                if image_data:
                    uploaded_image_path = f"{post_id}.jpg"
                    supabase.storage.from_("post-images").upload(
                        uploaded_image_path, image_data, {"content_type": "image/jpeg"}
                    )
                    image_url = supabase.storage.from_("post-images").get_public_url(uploaded_image_path)

            except Exception:
                # rollback: remove image if uploaded and delete post row if image upload fails
                if uploaded_image_path:
                    supabase.storage.from_("post-images").remove([uploaded_image_path])
                supabase.table("posts").delete().eq("postid", post_id).execute()
                raise

            content_data = {
                "postid": post_id,
                "content": {
                    "title": post.get("title_block"),
                    "summary": post.get("summary"),
                    "description": post.get("description"),
                    "slug": post.get("slug"),
                    "generated_image": image_url,
                },
                "isoldpost": False,
            }

            try:
                supabase.table("post_content").insert(content_data).execute()
            except Exception:
                # rollback: remove image and post row if content insert fails
                if uploaded_image_path:
                    supabase.storage.from_("post-images").remove([uploaded_image_path])
                supabase.table("posts").delete().eq("postid", post_id).execute()
                raise

            print(f"Inserted: {post['title']}")
            inserted += 1

        except Exception as e:
            failed += 1
            print(f"Error inserting '{post.get('title', '<unknown>')}': {e}")

    status = "completed_with_errors" if failed else "completed"
    return {
        "status": status,
        "total": total,
        "inserted": inserted,
        "failed": failed,
    }