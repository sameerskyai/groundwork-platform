import { redirect } from 'next/navigation'

// The pre-launch waitlist is the front door for now. The full marketing
// site (swipe demo, pricing, etc.) still exists at /home for when the
// product is ready to launch broadly -- not deleted, just not the default
// landing experience during the waitlist phase.
export default function RootPage() {
  redirect('/waitlist')
}
