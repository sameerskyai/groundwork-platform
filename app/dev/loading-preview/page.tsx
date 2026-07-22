import { notFound } from 'next/navigation'
import { LoadingScreen } from '@/components/loading/LoadingScreen'

/**
 * Unlinked dev-only harness for capturing evidence on LoadingScreen in
 * isolation. Not part of the app's real navigation or route tree logic --
 * exists solely so Playwright has a URL to screenshot against. 404s in
 * production so it never ships as a reachable page.
 */
export default function LoadingPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main style={{ minHeight: '100vh' }}>
      <LoadingScreen />
    </main>
  )
}
