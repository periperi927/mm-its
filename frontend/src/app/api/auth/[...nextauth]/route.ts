import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export async function GET(req: Request, ctx: any) {
  return handler(req, ctx);
}

export async function POST(req: Request, ctx: any) {
  return handler(req, ctx);
}