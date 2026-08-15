import { Elysia } from "elysia";
import { createProjectRoute } from "./routes/create-project.route";
import { deleteProjectRoute } from "./routes/delete-project.route";
import { getProjectRoute } from "./routes/get-project.route";
import { listProjectsRoute } from "./routes/list-projects.route";
import { updateProjectRoute } from "./routes/update-project.route";

export const projectRouter = new Elysia({ prefix: "/projects" })
    .use(listProjectsRoute)
    .use(createProjectRoute)
    .use(getProjectRoute)
    .use(updateProjectRoute)
    .use(deleteProjectRoute);
