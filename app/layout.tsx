import type React from "react"
import type { Metadata } from "next"
import { Work_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"
import { DelegationProvider } from "@/contexts/delegation-context"
import { AuthProvider } from "@/contexts/auth-context"
import { EventsProvider } from "@/contexts/events-context"
import { AuthGuard } from "@/components/auth-guard"
import { HIDDEN_MESSAGE_1 } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

// Use Work Sans as a more Bauhaus-inspired font
const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  variable: "--font-work-sans",
})

export const metadata: Metadata = {
  title: "Haus | Reality, in the making.",
  description:
    "Haus introduces dynamic, Real-Time Assets to the NFT space. Enter the Artist's workshop, and own artworks which acquire value with time.",
  metadataBase: new URL("https://haus.art"),
  openGraph: {
    title: "Haus | Reality, in the making.",
    description:
      "Haus introduces dynamic, Real-Time Assets to the NFT space. Enter the Artist's workshop, and own artworks which acquire value with time.",
    type: "website",
    locale: "en_US",
  },
  // Hidden message in metadata
  other: {
    "jabyl-signature": HIDDEN_MESSAGE_1,
  },
    generator: 'jabyl'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="application-name" content="Haus | Reality, in the making." />
        <meta
          name="description"
          content="Haus introduces dynamic, Real-Time Assets to the NFT space. Enter the Artist's workshop, and own artworks which acquire value with time."
        />
      </head>
      <body className={cn(
        workSans.className,
        workSans.variable,
        "min-h-screen bg-background antialiased"
      )}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <DelegationProvider>
              <EventsProvider>
                <AuthGuard>
                  <div className="relative flex min-h-screen flex-col">
                    <div className="flex-1 flex flex-col items-center">
                      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="animate-in fade-in duration-500 ease-out">
                          {children}
                        </div>
                      </main>
                    </div>
                    <Footer />
                  </div>
                  <Toaster />
                </AuthGuard>
              </EventsProvider>
            </DelegationProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* Hidden comment with encrypted message */}
        {/* <!-- jabyl: cmVhbGl0eSAtIGlzIHlldCB0byBiZSBpbnZlbnRlZC4= --> */}
      </body>
    </html>
  )
}
