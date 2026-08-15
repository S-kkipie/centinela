CREATE TYPE "public"."finding_kind" AS ENUM('OPORTUNIDAD', 'BANDERA_ROJA');--> statement-breakpoint
CREATE TABLE "findings" (
	"id" text PRIMARY KEY NOT NULL,
	"watchlist_id" text NOT NULL,
	"tender_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"kind" "finding_kind" NOT NULL,
	"score" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"raw" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "findings_watchlist_tender_uq" UNIQUE("watchlist_id","tender_id"),
	CONSTRAINT "findings_score_range" CHECK ("findings"."score" >= 0 AND "findings"."score" <= 100)
);
--> statement-breakpoint
CREATE TABLE "graph_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"watchlist_id" text NOT NULL,
	"finding_id" text,
	"from_nit" text NOT NULL,
	"to_nit" text NOT NULL,
	"relation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist_entities" (
	"id" text PRIMARY KEY NOT NULL,
	"watchlist_id" text NOT NULL,
	"nit" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchlist_entities_watchlist_nit_uq" UNIQUE("watchlist_id","nit"),
	CONSTRAINT "watchlist_entities_nit_not_empty" CHECK (length(trim("watchlist_entities"."nit")) > 0)
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "watchlists_name_not_empty" CHECK (length(trim("watchlists"."name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_entities" ADD CONSTRAINT "watchlist_entities_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "findings_watchlist_id_idx" ON "findings" USING btree ("watchlist_id");--> statement-breakpoint
CREATE INDEX "findings_kind_idx" ON "findings" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "findings_created_at_idx" ON "findings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "graph_edges_watchlist_id_idx" ON "graph_edges" USING btree ("watchlist_id");--> statement-breakpoint
CREATE INDEX "graph_edges_finding_id_idx" ON "graph_edges" USING btree ("finding_id");--> statement-breakpoint
CREATE INDEX "watchlist_entities_watchlist_id_idx" ON "watchlist_entities" USING btree ("watchlist_id");--> statement-breakpoint
CREATE INDEX "watchlist_entities_nit_idx" ON "watchlist_entities" USING btree ("nit");--> statement-breakpoint
CREATE INDEX "watchlists_user_id_idx" ON "watchlists" USING btree ("user_id");