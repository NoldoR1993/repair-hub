import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { env } from "./config.js";
import type { AuthUser, UserRole } from "./types.js";

const tokenPayloadSchema = z.object({
  sub: z.string(),
  username: z.string(),
  role: z.enum(["dispatcher", "master"]),
  displayName: z.string(),
});

export function signToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    },
    env.JWT_SECRET,
    { expiresIn: "12h" },
  );
}

export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  const payload = tokenPayloadSchema.parse(decoded);
  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    displayName: payload.displayName,
  };
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply.code(401).send({ message: "Missing bearer token" });
    return null;
  }

  try {
    const token = header.slice("Bearer ".length);
    return verifyToken(token);
  } catch {
    reply.code(401).send({ message: "Invalid token" });
    return null;
  }
}

export async function requireRole(request: FastifyRequest, reply: FastifyReply, role: UserRole) {
  const user = await requireUser(request, reply);
  if (!user) {
    return null;
  }

  if (user.role !== role) {
    reply.code(403).send({ message: `Forbidden for role ${user.role}` });
    return null;
  }

  return user;
}
