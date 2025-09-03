import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId as requestIdMiddleware } from "hono/request-id";
import { timeout as timeoutMiddleware } from "hono/timeout";

// [uv1000] api routes
import battleRoutes from "./battleRoute";

const app = new Hono()
  .use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Methods"
      ],
      exposeHeaders: ["Content-Length", "X-Request-Id"],
      credentials: true,
      maxAge: 86400
    })
  )
  .use(timeoutMiddleware(60_000))
  .use(requestIdMiddleware());

// Mount routes
app.route("/battle", battleRoutes);

// Landing Page
app.get("/", (c) => {
  return c.text("blitz-oracle says fight! ⚔️");
});

app.notFound((c) => c.text("These aren't the droids you're looking for", 404));
app.onError(async (err, c) => {
  // standard hono exceptions
  // https://hono.dev/docs/api/exception#handling-httpexception
  if (err instanceof HTTPException) return err.getResponse();

  // Unhandled Exceptions - should not occur
  return c.json(
    {
      error: err.message,
      requestId: c.get("requestId"),
      url: c.req.url,
    },
    500
  );
});

export type AppType = typeof app;
export { app };
