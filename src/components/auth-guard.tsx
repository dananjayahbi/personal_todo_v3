"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "loading") return // Still loading

    // Allow access to public pages (login and forgot-password)
    const publicPages = ["/login", "/forgot-password"]
    if (publicPages.includes(pathname)) {
      if (session && pathname !== "/forgot-password") {
        router.push("/")
      }
      return
    }

    // Redirect to login if not authenticated
    if (!session) {
      router.push("/login")
      return
    }
  }, [session, status, router, pathname])

  // Show loading spinner while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If on public pages and not authenticated, show content
  const publicPages = ["/login", "/forgot-password"]
  if (publicPages.includes(pathname) && !session) {
    return <>{children}</>
  }

  // If not authenticated and not on public pages, don't render anything (will redirect)
  if (!session && !publicPages.includes(pathname)) {
    return null
  }

  // If authenticated, show the protected content
  return <>{children}</>
}
