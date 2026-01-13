
  create table "public"."raw_api_data" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "source_name" character varying not null default ''::character varying,
    "description" character varying default ''::character varying,
    "website" text not null default ''::text,
    "title" character varying default ''::character varying
      );


alter table "public"."raw_api_data" enable row level security;

CREATE UNIQUE INDEX raw_api_data_pkey ON public.raw_api_data USING btree (id);

CREATE UNIQUE INDEX raw_api_data_title_key ON public.raw_api_data USING btree (title);

CREATE UNIQUE INDEX raw_api_data_website_key ON public.raw_api_data USING btree (website);

alter table "public"."raw_api_data" add constraint "raw_api_data_pkey" PRIMARY KEY using index "raw_api_data_pkey";

alter table "public"."raw_api_data" add constraint "raw_api_data_title_key" UNIQUE using index "raw_api_data_title_key";

alter table "public"."raw_api_data" add constraint "raw_api_data_website_key" UNIQUE using index "raw_api_data_website_key";

grant delete on table "public"."raw_api_data" to "anon";

grant insert on table "public"."raw_api_data" to "anon";

grant references on table "public"."raw_api_data" to "anon";

grant select on table "public"."raw_api_data" to "anon";

grant trigger on table "public"."raw_api_data" to "anon";

grant truncate on table "public"."raw_api_data" to "anon";

grant update on table "public"."raw_api_data" to "anon";

grant delete on table "public"."raw_api_data" to "authenticated";

grant insert on table "public"."raw_api_data" to "authenticated";

grant references on table "public"."raw_api_data" to "authenticated";

grant select on table "public"."raw_api_data" to "authenticated";

grant trigger on table "public"."raw_api_data" to "authenticated";

grant truncate on table "public"."raw_api_data" to "authenticated";

grant update on table "public"."raw_api_data" to "authenticated";

grant delete on table "public"."raw_api_data" to "postgres";

grant insert on table "public"."raw_api_data" to "postgres";

grant references on table "public"."raw_api_data" to "postgres";

grant select on table "public"."raw_api_data" to "postgres";

grant trigger on table "public"."raw_api_data" to "postgres";

grant truncate on table "public"."raw_api_data" to "postgres";

grant update on table "public"."raw_api_data" to "postgres";

grant delete on table "public"."raw_api_data" to "service_role";

grant insert on table "public"."raw_api_data" to "service_role";

grant references on table "public"."raw_api_data" to "service_role";

grant select on table "public"."raw_api_data" to "service_role";

grant trigger on table "public"."raw_api_data" to "service_role";

grant truncate on table "public"."raw_api_data" to "service_role";

grant update on table "public"."raw_api_data" to "service_role";


