import { useState } from 'react'
import { MessageCircleIcon, SendIcon, X, Loader2 } from 'lucide-react'
import api from '../../api/axios'

const ChatWidget = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

 const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: "user", text: input }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)
    try {
      const { data } = await api.post('/chat', { 
        message: input,
        history: updatedMessages  // pichle messages bhejo context ke liye
      })
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }])
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong." }])
    } finally {
      setLoading(false)
    }
}

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className='fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700'>
        <MessageCircleIcon className='w-6 h-6' />
      </button>
    )
  }

  return (
    <div className='fixed bottom-6 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200'>
      <div className='flex justify-between items-center p-4 border-b border-slate-100'>
        <h3 className='font-semibold text-slate-900'>HR Assistant</h3>
        <button onClick={() => setOpen(false)}><X className='w-4 h-4' /></button>
      </div>
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {messages.map((m, i) => (
          <div key={i} className={`text-sm p-2.5 rounded-xl max-w-[85%] ${m.role === "user" ? "bg-indigo-600 text-white ml-auto" : "bg-slate-100 text-slate-700"}`}>
            {m.text}
          </div>
        ))}
        {loading && <Loader2 className='w-4 h-4 animate-spin text-slate-400' />}
      </div>
      <div className='p-3 border-t border-slate-100 flex gap-2'>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder='Ask something...' className='flex-1' />
        <button onClick={sendMessage} className='p-2 bg-indigo-600 text-white rounded-lg'>
          <SendIcon className='w-4 h-4' />
        </button>
      </div>
    </div>
  )
}

export default ChatWidget