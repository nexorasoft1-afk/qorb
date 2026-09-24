import { cookies } from "next/headers";
import jwt, { type JwtPayload } from "jsonwebtoken";

const SESSION_COOKIE = "qorb_session";

const envJwtSecret = process.env.JWT_SECRET;

if (!envJwtSecret) {
  throw new Error("JWT_SECRET is not defined");
}

const JWT_SECRET: string = envJwtSecret;

export type SessionUser = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: "User" | "BusinessOwner" | "Admin";
};

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<SessionUser>;

  return (
    typeof payload.id === "number" &&
    typeof payload.fullName === "string" &&
    (payload.email === null ||
      typeof payload.email === "string") &&
    (payload.phone === null ||
      typeof payload.phone === "string") &&
    (payload.role === "User" ||
      payload.role === "BusinessOwner" ||
      payload.role === "Admin")
  );
}

export async function createSession(user: SessionUser) {
  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: "30d",
  });

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const decoded: string | JwtPayload = jwt.verify(
      token,
      JWT_SECRET
    );

    if (!isSessionUser(decoded)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireRole(
  roles: SessionUser["role"][]
): Promise<SessionUser> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

