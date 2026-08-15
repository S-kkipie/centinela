import { Elysia } from "elysia";
import { triggerSweepRoute } from "./routes/trigger-sweep.route";

export const agentRouter = new Elysia({ prefix: "/agent" }).use(
    triggerSweepRoute,
);
