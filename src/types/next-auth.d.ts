import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
    user: {
      id: string
    } & DefaultSession["user"]
  }

  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
    id?: string
  }
}