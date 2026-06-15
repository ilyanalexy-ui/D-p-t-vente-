import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = { title: 'NH Dépôt-Vente', description: 'Gestion dépôt-vente' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <div style={{ display:'flex', minHeight:'100vh' }}>
            <Sidebar />
            <main style={{ flex:1, background:'var(--bg)', paddingBottom:80 }}>
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
