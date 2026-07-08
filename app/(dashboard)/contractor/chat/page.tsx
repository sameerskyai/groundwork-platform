'use client'

import dynamic from 'next/dynamic'

// Reuse the chat UI — contractor chat is identical layout, role is determined server-side
const ChatPage = dynamic(() => import('@/app/(dashboard)/homeowner/chat/page'), { ssr: false })

export default function ContractorChatPage() {
  return <ChatPage />
}
