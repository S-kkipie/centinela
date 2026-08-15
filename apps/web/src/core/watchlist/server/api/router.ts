import { Elysia } from "elysia";
import { addEntityRoute } from "./routes/add-entity.route";
import { createWatchlistRoute } from "./routes/create-watchlist.route";
import { deleteWatchlistRoute } from "./routes/delete-watchlist.route";
import { getWatchlistRoute } from "./routes/get-watchlist.route";
import { listWatchlistsRoute } from "./routes/list-watchlists.route";
import { removeEntityRoute } from "./routes/remove-entity.route";
import { updateWatchlistRoute } from "./routes/update-watchlist.route";

export const watchlistRouter = new Elysia({ prefix: "/watchlists" })
    .use(listWatchlistsRoute)
    .use(createWatchlistRoute)
    .use(getWatchlistRoute)
    .use(updateWatchlistRoute)
    .use(deleteWatchlistRoute)
    .use(addEntityRoute)
    .use(removeEntityRoute);
