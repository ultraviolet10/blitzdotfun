import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { requestId as requestIdMiddleware } from "hono/request-id"
import { timeout as timeoutMiddleware } from "hono/timeout"

// [uv1000] api routes

const app = new Hono()
    .use(
        "*",
        cors({
            origin: "*",
            allowMethods: ["GET", "POST", "OPTIONS"],
            allowHeaders: ["Content-Type"],
            maxAge: 86400, // max allowable age for cached preflight requests (some browsers will downgrade this)
        }),
    )
    .use(timeoutMiddleware(30_000))
    .use(requestIdMiddleware())

// Landing Page
app.get("/", (c) => {
    return c.text("blitz-oracle says fight! ⚔️")
})

app.notFound((c) => c.text("These aren't the droids you're looking for", 404))
app.onError(async (err, c) => {
    // standard hono exceptions
    // https://hono.dev/docs/api/exception#handling-httpexception
    if (err instanceof HTTPException) return err.getResponse()

    // Unhandled Exceptions - should not occur
    return c.json(
        {
            error: err.message,
            requestId: c.get("requestId"),
            url: c.req.url,
        },
        500,
    )
})

export type AppType = typeof app
export { app }
