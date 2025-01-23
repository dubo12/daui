import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import ReactMarkdown from 'react-markdown'
import { SendHorizontal, MenuIcon } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  'https://odclcapxohxtqjilbmhb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2xjYXB4b2h4dHFqaWxibWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NjM5NDQsImV4cCI6MjA1MzIzOTk0NH0.srl1m3Wit1RCnHqx7bm8rHbenJVOMhgUm4zhRRHccwA'
)

type Message = {
  id: string
  content: string
  type: 'human' | 'ai'
  created_at: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(uuidv4())
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Fetch initial messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data.map(msg => ({
        id: msg.id,
        content: msg.content,
        type: msg.type,
        created_at: msg.created_at
      })))
    }

    loadMessages()

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        setMessages(prev => [...prev, {
          id: payload.new.id,
          content: payload.new.content,
          type: payload.new.type,
          created_at: payload.new.created_at
        }])
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId])

  const sendMessage = async () => {
    if (!input.trim()) return

    setLoading(true)
    const newMessage = input
    setInput('')

    try {
      // Add user message immediately
      setMessages(prev => [...prev, {
        id: uuidv4(),
        content: newMessage,
        type: 'human',
        created_at: new Date().toISOString()
      }])

      const response = await fetch('https://n8n-pjm6.onrender.com/webhook/invoke-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: newMessage,
          user_id: 'NA',
          request_id: uuidv4(),
          session_id: sessionId
        })
      })

      if (!response.ok) throw new Error('API request failed')
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => prev.filter(msg => msg.type !== 'human' || msg.content !== newMessage))
    } finally {
      setLoading(false)
    }
  }

  return (
    &lt;div className="flex flex-col h-full bg-gray-900 text-gray-100"&gt;
      &lt;div className="flex-1 overflow-y-auto p-4 space-y-4"&gt;
        {messages.map((message) => (
          &lt;div
            key={message.id}
            className={`flex ${message.type === 'human' ? 'justify-end' : 'justify-start'}`}
          &gt;
            &lt;div
              className={`max-w-3xl p-4 rounded-lg ${
                message.type === 'human'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            &gt;
              &lt;ReactMarkdown className="prose dark:prose-invert"&gt;
                {message.content}
              &lt;/ReactMarkdown&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        ))}
        &lt;div ref={messagesEndRef} /&gt;
      &lt;/div&gt;

      &lt;div className="p-4 border-t border-gray-700"&gt;
        &lt;div className="flex items-center space-x-4"&gt;
          &lt;input
            type="text"
            value={input}
            onChange={(e) =&gt; setInput(e.target.value)}
            onKeyPress={(e) =&gt; e.key === 'Enter' &amp;&amp; !loading &amp;&amp; sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          /&gt;
          &lt;button
            onClick={sendMessage}
            disabled={loading}
            className="p-3 bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          &gt;
            &lt;SendHorizontal size={20} /&gt;
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  )
}
