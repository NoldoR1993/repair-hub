import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { pool, withTransaction } from "./db.js";
import { corsOrigins, env } from "./config.js";
import { requireRole, requireUser, signToken, verifyPassword } from "./auth.js";
import type { RequestStatus } from "./types.js";
import { dispatcherTransitionRules } from "./request-transition-rules.js";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const createRequestSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{7,20}$/),
  address: z.string().trim().min(5).max(300),
  problemText: z.string().trim().min(10).max(1000),
});

const assignSchema = z.object({
  masterId: z.string().uuid(),
  version: z.number().int().positive(),
});

const versionSchema = z.object({
  version: z.number().int().positive(),
});

function badRequest(error: unknown) {
  if (error instanceof z.ZodError) {
    return { statusCode: 400, body: { message: "Validation error", issues: error.flatten() } };
  }
  throw error;
}

async function updateRequestStatus(params: {
  requestId: string;
  version: number;
  nextStatus: RequestStatus;
  assignedTo?: string | null;
  clearAssignedTo?: boolean;
  allowedCurrentStatuses?: RequestStatus[];
  actorId: string;
}) {
  return withTransaction(async (client) => {
    const currentResult = await client.query<{
      id: string;
      version: number;
      status: RequestStatus;
      assigned_to: string | null;
    }>(
      "SELECT id, version, status, assigned_to FROM requests WHERE id = $1",
      [params.requestId],
    );

    if (currentResult.rowCount === 0) {
      return { kind: "not_found" as const };
    }

    const current = currentResult.rows[0];

    if (params.allowedCurrentStatuses && !params.allowedCurrentStatuses.includes(current.status)) {
      return {
        kind: "invalid_transition" as const,
        currentStatus: current.status,
        allowedStatuses: params.allowedCurrentStatuses,
      };
    }

    const updateResult = await client.query<{
      id: string;
      version: number;
      status: RequestStatus;
      assigned_to: string | null;
      updated_at: string;
    }>(
      `UPDATE requests
       SET status = $1,
           version = version + 1,
           assigned_to = CASE
             WHEN $5 THEN NULL
             WHEN $2::uuid IS NOT NULL THEN $2::uuid
             ELSE assigned_to
           END,
           updated_at = NOW()
       WHERE id = $3 AND version = $4
       RETURNING id, version, status, assigned_to, updated_at`,
      [params.nextStatus, params.assignedTo ?? null, params.requestId, params.version, params.clearAssignedTo ?? false],
    );

    if (updateResult.rowCount === 0) {
      return {
        kind: "conflict" as const,
        currentVersion: current.version,
        currentStatus: current.status,
      };
    }

    await client.query(
      `INSERT INTO audit_log (request_id, old_status, new_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.requestId,
        current.status,
        params.nextStatus,
        params.actorId,
        `Status changed from ${current.status} to ${params.nextStatus}`,
      ],
    );

    return { kind: "ok" as const, request: updateResult.rows[0] };
  });
}

export function buildServer() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      try {
        const url = new URL(origin);
        const isLocalhost =
          (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
          ["3000", "4173", "5173", "8080"].includes(url.port);

        callback(null, isLocalhost);
      } catch {
        callback(null, false);
      }
    },
    credentials: true,
  });

  app.get("/health", async () => {
    const result = await pool.query("SELECT 1");
    return { ok: true, db: result.rowCount === 1 };
  });

  app.post("/auth/login", async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const result = await pool.query<{
        id: string;
        username: string;
        password_hash: string;
        role: "dispatcher" | "master";
        display_name: string;
      }>(
        "SELECT id, username, password_hash, role, display_name FROM users WHERE username = $1",
        [body.username],
      );

      if (result.rowCount === 0) {
        return reply.code(401).send({ message: "Invalid credentials" });
      }

      const user = result.rows[0];
      const ok = await verifyPassword(body.password, user.password_hash);
      if (!ok) {
        return reply.code(401).send({ message: "Invalid credentials" });
      }

      return {
        token: signToken({
          id: user.id,
          username: user.username,
          role: user.role,
          displayName: user.display_name,
        }),
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          displayName: user.display_name,
        },
      };
    } catch (error) {
      const failure = badRequest(error);
      return reply.code(failure.statusCode).send(failure.body);
    }
  });

  app.get("/users/masters", async (request, reply) => {
    const user = await requireRole(request, reply, "dispatcher");
    if (!user) {
      return;
    }

    const result = await pool.query(
      "SELECT id, username, display_name FROM users WHERE role = 'master' ORDER BY display_name",
    );
    return result.rows;
  });

  app.post("/requests", async (request, reply) => {
    try {
      const body = createRequestSchema.parse(request.body);
      const result = await pool.query(
        `INSERT INTO requests (client_name, phone, address, problem_text)
         VALUES ($1, $2, $3, $4)
         RETURNING id, client_name, phone, address, problem_text, status, version, assigned_to, created_at, updated_at`,
        [body.clientName, body.phone, body.address, body.problemText],
      );
      return reply.code(201).send(result.rows[0]);
    } catch (error) {
      const failure = badRequest(error);
      return reply.code(failure.statusCode).send(failure.body);
    }
  });

  app.get("/requests", async (request, reply) => {
    const user = await requireRole(request, reply, "dispatcher");
    if (!user) {
      return;
    }

    const querySchema = z.object({
      status: z.enum(["new", "assigned", "in_progress", "done", "canceled"]).optional(),
    });

    try {
      const query = querySchema.parse(request.query);
      const values: string[] = [];
      let whereSql = "";

      if (query.status) {
        values.push(query.status);
        whereSql = `WHERE r.status = $${values.length}`;
      }

      const result = await pool.query(
        `SELECT
           r.id,
           r.client_name,
           r.phone,
           r.address,
           r.problem_text,
           r.status,
           r.version,
           r.assigned_to,
           r.created_at,
           r.updated_at,
           u.display_name AS assigned_to_name
         FROM requests r
         LEFT JOIN users u ON u.id = r.assigned_to
         ${whereSql}
         ORDER BY r.created_at DESC`,
        values,
      );
      return result.rows;
    } catch (error) {
      const failure = badRequest(error);
      return reply.code(failure.statusCode).send(failure.body);
    }
  });

  app.get("/requests/mine", async (request, reply) => {
    const user = await requireRole(request, reply, "master");
    if (!user) {
      return;
    }

    const result = await pool.query(
      `SELECT id, client_name, phone, address, problem_text, status, version, assigned_to, created_at, updated_at
       FROM requests
       WHERE assigned_to = $1 AND status IN ('assigned', 'in_progress')
       ORDER BY created_at DESC`,
      [user.id],
    );
    return result.rows;
  });

  app.get("/requests/:id/audit", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) {
      return;
    }

    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const result = await pool.query(
      `SELECT
         a.id,
         a.old_status,
         a.new_status,
         a.note,
         a.created_at,
         u.display_name AS changed_by_name
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.changed_by
       WHERE a.request_id = $1
       ORDER BY a.created_at ASC`,
      [params.id],
    );
    return result.rows;
  });

  app.patch("/requests/:id/assign", async (request, reply) => {
    const user = await requireRole(request, reply, "dispatcher");
    if (!user) {
      return;
    }

    try {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = assignSchema.parse(request.body);
      const result = await updateRequestStatus({
        requestId: params.id,
        version: body.version,
        nextStatus: "assigned",
        assignedTo: body.masterId,
        allowedCurrentStatuses: dispatcherTransitionRules.assign,
        actorId: user.id,
      });

      if (result.kind === "not_found") {
        return reply.code(404).send({ message: "Request not found" });
      }

      if (result.kind === "conflict") {
        return reply.code(409).send(result);
      }
      if (result.kind === "invalid_transition") {
        return reply.code(409).send({
          message: `Request cannot be assigned from status ${result.currentStatus}`,
          ...result,
        });
      }

      return result.request;
    } catch (error) {
      const failure = badRequest(error);
      return reply.code(failure.statusCode).send(failure.body);
    }
  });

  app.patch("/requests/:id/cancel", async (request, reply) => {
    const user = await requireRole(request, reply, "dispatcher");
    if (!user) {
      return;
    }

    try {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = versionSchema.parse(request.body);
      const result = await updateRequestStatus({
        requestId: params.id,
        version: body.version,
        nextStatus: "canceled",
        clearAssignedTo: true,
        allowedCurrentStatuses: dispatcherTransitionRules.cancel,
        actorId: user.id,
      });

      if (result.kind === "not_found") {
        return reply.code(404).send({ message: "Request not found" });
      }
      if (result.kind === "conflict") {
        return reply.code(409).send(result);
      }
      if (result.kind === "invalid_transition") {
        return reply.code(409).send({
          message: `Request cannot be canceled from status ${result.currentStatus}`,
          ...result,
        });
      }

      return result.request;
    } catch (error) {
      const failure = badRequest(error);
      return reply.code(failure.statusCode).send(failure.body);
    }
  });

  app.patch("/requests/:id/take", async (request, reply) => {
    const user = await requireRole(request, reply, "master");
    if (!user) {
      return;
    }

    try {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = versionSchema.parse(request.body);
      const ownership = await pool.query<{ assigned_to: string | null; status: RequestStatus }>(
        "SELECT assigned_to, status FROM requests WHERE id = $1",
        [params.id],
      );

      if (ownership.rowCount === 0) {
        return reply.code(404).send({ message: "Request not found" });
      }

      const current = ownership.rows[0];
      if (current.assigned_to !== user.id) {
        return reply.code(403).send({ message: "Request is assigned to another master" });
      }
      if (current.status !== "assigned") {
        return reply.code(409).send({ message: "Request cannot be taken from current status" });
      }

      const result = await updateRequestStatus({
        requestId: params.id,
        version: body.version,
        nextStatus: "in_progress",
        actorId: user.id,
      });

      if (result.kind === "not_found") {
        return reply.code(404).send({ message: "Request not found" });
      }
      if (result.kind === "conflict") {
        return reply.code(409).send(result);
      }

      return result.request;
    } catch (error) {
      const failure = badRequest(error);
      return reply.code(failure.statusCode).send(failure.body);
    }
  });

  app.patch("/requests/:id/complete", async (request, reply) => {
    const user = await requireRole(request, reply, "master");
    if (!user) {
      return;
    }

    try {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = versionSchema.parse(request.body);
      const ownership = await pool.query<{ assigned_to: string | null; status: RequestStatus }>(
        "SELECT assigned_to, status FROM requests WHERE id = $1",
        [params.id],
      );

      if (ownership.rowCount === 0) {
        return reply.code(404).send({ message: "Request not found" });
      }

      const current = ownership.rows[0];
      if (current.assigned_to !== user.id) {
        return reply.code(403).send({ message: "Request is assigned to another master" });
      }
      if (current.status !== "in_progress") {
        return reply.code(409).send({ message: "Request cannot be completed from current status" });
      }

      const result = await updateRequestStatus({
        requestId: params.id,
        version: body.version,
        nextStatus: "done",
        actorId: user.id,
      });

      if (result.kind === "not_found") {
        return reply.code(404).send({ message: "Request not found" });
      }
      if (result.kind === "conflict") {
        return reply.code(409).send(result);
      }

      return result.request;
    } catch (error) {
      const failure = badRequest(error);
      return reply.code(failure.statusCode).send(failure.body);
    }
  });

  return app;
}

const app = buildServer();

app.listen({ host: env.HOST, port: env.PORT }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
