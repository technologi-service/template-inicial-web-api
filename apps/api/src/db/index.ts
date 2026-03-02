import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

const pool = new Pool({ connectionString: Bun.env.DATABASE_URL! });

export const db = drizzle(pool, { schema });
