


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cpus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "date" character varying,
    "socket" character varying,
    "category" character varying,
    "speed" double precision,
    "turbo" double precision,
    "cores" integer,
    "threads" integer,
    "l1_cache" double precision,
    "l2_cache" double precision,
    "l3_cache" double precision,
    "embedding" "public"."vector"(384)
);


ALTER TABLE "public"."cpus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_id" "uuid" NOT NULL,
    "avg_fps" integer,
    "min_fps" integer,
    "max_fps" integer,
    "preset" character varying,
    "resolution" character varying,
    "upscaling" character varying,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."game_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "image_url" character varying,
    "embedding" "public"."vector"(384)
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gpus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brand" character varying,
    "name" character varying NOT NULL,
    "shading_units" integer,
    "boost_clock" character varying,
    "game_clock" character varying,
    "gpu_clock" character varying,
    "fp32" character varying,
    "mem_bandwidth" character varying,
    "vram" character varying,
    "mem_type" character varying,
    "mem_bus" character varying,
    "rops" integer,
    "tmus" integer,
    "pixel_rate" character varying,
    "texture_rate" character varying,
    "architecture" character varying,
    "process" character varying,
    "release_date" character varying,
    "tdp" character varying,
    "rt_cores" integer,
    "tensor_cores" integer,
    "dx" character varying,
    "vulkan" character varying,
    "cuda" character varying,
    "fp16" character varying,
    "transistors" character varying,
    "embedding" "public"."vector"(384)
);


ALTER TABLE "public"."gpus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying,
    "email" character varying NOT NULL,
    "profile_photo" character varying,
    "gpu_id" "uuid",
    "cpu_id" "uuid",
    "ram" character varying,
    "password" character varying,
    "otp_secret" character varying,
    "ativo" boolean
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cpus"
    ADD CONSTRAINT "cpus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_users"
    ADD CONSTRAINT "game_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gpus"
    ADD CONSTRAINT "gpus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "ix_cpus_name" ON "public"."cpus" USING "btree" ("name");



CREATE INDEX "ix_games_name" ON "public"."games" USING "btree" ("name");



CREATE INDEX "ix_gpus_name" ON "public"."gpus" USING "btree" ("name");



CREATE UNIQUE INDEX "ix_users_email" ON "public"."users" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "update_game_users_modtime" BEFORE UPDATE ON "public"."game_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."game_users"
    ADD CONSTRAINT "game_users_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id");



ALTER TABLE ONLY "public"."game_users"
    ADD CONSTRAINT "game_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_cpu_id_fkey" FOREIGN KEY ("cpu_id") REFERENCES "public"."cpus"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_gpu_id_fkey" FOREIGN KEY ("gpu_id") REFERENCES "public"."gpus"("id");



CREATE POLICY "Enable delete for authenticated users only" ON "public"."cpus" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."games" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."gpus" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."cpus" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."games" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."gpus" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK (true);



CREATE POLICY "Enable insert for users based on user_id" ON "public"."users" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Enable select for authenticated users only" ON "public"."cpus" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable select for authenticated users only" ON "public"."games" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable select for authenticated users only" ON "public"."gpus" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."cpus" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."games" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."gpus" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can delete ther own games" ON "public"."game_users" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert ther own games" ON "public"."game_users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can select ther own games" ON "public"."game_users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update ther own games" ON "public"."game_users" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."cpus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gpus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON TABLE "public"."cpus" TO "anon";
GRANT ALL ON TABLE "public"."cpus" TO "authenticated";
GRANT ALL ON TABLE "public"."cpus" TO "service_role";



GRANT ALL ON TABLE "public"."game_users" TO "anon";
GRANT ALL ON TABLE "public"."game_users" TO "authenticated";
GRANT ALL ON TABLE "public"."game_users" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."gpus" TO "anon";
GRANT ALL ON TABLE "public"."gpus" TO "authenticated";
GRANT ALL ON TABLE "public"."gpus" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







