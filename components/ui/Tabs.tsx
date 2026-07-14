import React, { createContext, useState } from 'react'

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
}

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export const Tabs = ({ defaultValue, children }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

export const TabsList = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div
      ref={ref}
      className="flex border-b gap-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  )
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
}

export const TabsTrigger = ({ value, children }: TabsTriggerProps) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.activeTab === value
  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className="px-4 py-3 font-medium border-b-2 transition-colors"
      style={{
        borderColor: isActive ? 'var(--color-brand)' : 'transparent',
        color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)'
      }}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
}

export const TabsContent = ({ value, children }: TabsContentProps) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.activeTab !== value) return null
  return <div>{children}</div>
}
