"""Write one finished post to the flat ``posts`` table.

Per-item insertion pairs with the caller's terminal status transition. Image
cleanup is conservative because an insert exception can arrive after the database
has committed the row.
"""

import logging
import uuid

from backend.db.client import supabase

logger = logging.getLogger(__name__)

BUCKET = "post-images"


def _upload_image(
    image_data: bytes | None, post_id: str
) -> tuple[str | None, str | None]:
    """Upload an image and return its public URL and storage path.

    A missing thumbnail is not a reason to discard an otherwise finished post.
    """
    if not image_data:
        return None, None

    path = f"{post_id}.jpg"
    try:
        supabase.storage.from_(BUCKET).upload(
            path, image_data, {"content_type": "image/jpeg"}
        )
        return supabase.storage.from_(BUCKET).get_public_url(path), path
    except Exception as error:
        logger.error("Image upload failed for %s: %s", post_id, error)
        return None, None


def _post_exists(post_id: str) -> bool:
    response = supabase.table("posts").select("id").eq("id", post_id).limit(1).execute()
    return bool(response.data)


def insert_cleaned_data(state: dict) -> str:
    """Insert one generated post and return its ID.

    If the insert response fails after a possible commit, verify the row before
    cleaning up its image. An unverifiable image is retained for reconciliation.
    """
    slug = state.get("slug")
    title = state.get("title") or (state.get("title_block") or {}).get("content")
    description = state.get("description")

    if not slug:
        raise ValueError(
            "cannot insert post: slug is empty (slug_node produced nothing)"
        )
    if not title:
        raise ValueError("cannot insert post: title is empty")
    if not isinstance(description, str) or not description.strip():
        raise ValueError("cannot insert post: description is empty")

    post_id = str(uuid.uuid4())
    image_url, uploaded_path = _upload_image(state.get("generated_image"), post_id)

    row = {
        "id": post_id,
        "slug": slug,
        "title": title,
        "summary": state.get("summary"),
        "description": description,
        "source_url": state.get("source_url"),
        "source_name": state.get("name"),
        "image_url": image_url,
        "tags": state.get("tags") or [],
        "difficulty": state.get("difficulty"),
        "read_time": state.get("read_time"),
        # The dedup embedding also powers related-post lookup.
        "embedding": state.get("embedding"),
        "raw_item_id": state.get("raw_id"),
        "likes_count": 0,
    }

    try:
        supabase.table("posts").insert(row).execute()
    except Exception as insert_error:
        try:
            row_exists = _post_exists(post_id)
        except Exception as verification_error:
            logger.error(
                "Post insert failed for %s and its outcome could not be verified; "
                "retaining image %s for reconciliation",
                post_id,
                uploaded_path,
            )
            raise insert_error from verification_error

        if row_exists:
            logger.warning(
                "Post insert response failed for %s, but the row exists; treating it as committed",
                post_id,
            )
            return post_id

        if uploaded_path:
            try:
                supabase.storage.from_(BUCKET).remove([uploaded_path])
            except Exception as cleanup_error:
                logger.error("Image rollback failed for %s: %s", post_id, cleanup_error)
        raise

    logger.info("Inserted post %s (%s)", slug, post_id)
    return post_id
