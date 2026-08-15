import { Elysia } from "elysia";
import { getGraphRoute } from "./routes/get-graph.route";
import { listFindingsRoute } from "./routes/list-findings.route";

export const findingRouter = new Elysia({ prefix: "/findings" }).use(
    listFindingsRoute,
);

export const graphRouter = new Elysia({ prefix: "/graph" }).use(getGraphRoute);
