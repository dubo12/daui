import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Home from './features/auth/Home'
import Chat from './features/chat/Chat'

const supabase = createClient(
  'https://odclcapxohxtqjilbmhb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2xjYXB4b2h4dHFqaWxibWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NjM5NDQsImV4cCI6MjA1MzIzOTk0NH0.srl1m3Wit1RCnHqx7bm8rHbenJVOMhgUm4zhRRHccwA'
)

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900">
      {user ? <Chat /> : <Home />}
    </div>
  )
}

export default App
