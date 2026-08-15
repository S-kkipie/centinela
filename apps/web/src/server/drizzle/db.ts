import { drizzle } from "drizzle-orm/node-postgres";
import { ServerConfig } from "@/config/server-config";
import * as schema from "@/server/drizzle/schemas";

export const db = drizzle({
    connection: {
        connectionString: ServerConfig.databaseURL,
        ssl: { rejectUnauthorized: false },
    },
    schema,
    casing: "snake_case",
});
