import { LoadingScreen } from '@/components/loading/LoadingScreen'

/**
 * Unlinked dev-only harness for capturing evidence on LoadingScreen in
 * isolation. Not part of the app's real navigation or route tree logic --
 * exists solely so Playwright has a URL to screenshot against.
 */
export default function LoadingPreviewPage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      <LoadingScreen />
    </main>
  )
}
