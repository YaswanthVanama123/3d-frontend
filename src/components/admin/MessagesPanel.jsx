import { Archive, MailOpen, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { formatDateTime } from '../../lib/format.js'

export default function MessagesPanel({ call, onChange }) {
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const list = await call((t) => api.admin.messages(t))
      if (list) setMessages(list)
    } catch (err) {
      setError(err.message)
    }
  }, [call])

  useEffect(() => {
    load()
  }, [load])

  const update = async (id, status) => {
    try {
      await call((t) => api.admin.updateMessage(t, id, status))
      setMessages((list) => (status === 'archived' ? list.filter((m) => m.id !== id) : list.map((m) => (m.id === id ? { ...m, status } : m))))
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  if (error)
    return (
      <div className="alert alert-error">
        <TriangleAlert size={18} /> {error}
      </div>
    )
  if (!messages) return <div className="page-loader" style={{ minHeight: 200, paddingTop: 0 }}><span className="spinner" /></div>
  if (messages.length === 0) return <p className="empty admin-card">No messages yet.</p>

  return (
    <div className="message-list">
      {messages.map((m) => (
        <article key={m.id} className="message" data-status={m.status}>
          <header>
            <div>
              <strong>{m.name}</strong> · <a href={`mailto:${m.email}`}>{m.email}</a>
              {m.phone && <span className="cell-sub">{m.phone}</span>}
            </div>
            <span className="cell-sub">
              {m.status === 'new' ? 'New · ' : ''}
              {formatDateTime(m.createdAt)}
            </span>
          </header>
          {m.subject && <strong style={{ fontSize: 14.5 }}>{m.subject}</strong>}
          <p>{m.message}</p>
          <div className="chip-row">
            {m.status === 'new' && (
              <button type="button" className="btn btn-glass btn-sm" onClick={() => update(m.id, 'read')}>
                <MailOpen size={15} /> Mark as read
              </button>
            )}
            <a className="btn btn-ghost btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Your message'}`)}`}>
              Reply
            </a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => update(m.id, 'archived')}>
              <Archive size={15} /> Archive
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
