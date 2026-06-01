import type { Session } from "./auth-store";

export function getShopId(session: Session | null): string | null {
  if (!session) return null;
  return session.shopId || session.ownerId || session.userId;
}

export function getShopOwnerId(session: Session | null): string | null {
  if (!session) return null;
  return session.ownerId || session.userId;
}
