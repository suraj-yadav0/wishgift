import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  const user = session.user as Record<string, unknown>;
  return (user.id as string) || null;
}
