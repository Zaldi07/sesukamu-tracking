import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Lacak Status Pesanan - Sesukamu Tracking",
  description: "Pantau status verifikasi konfirmasi pembayaran, kesiapan pengambilan, hingga pesanan selesai secara real-time.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const removeAttr = () => {
                  document.querySelectorAll('[bis_skin_checked]').forEach(el => el.removeAttribute('bis_skin_checked'));
                };
                removeAttr();
                if (typeof window !== 'undefined' && window.MutationObserver) {
                  const observer = new MutationObserver(removeAttr);
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                }
              })();
            `,
          }}
        />
        <ThemeProvider defaultTheme="system" storageKey="theme" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
