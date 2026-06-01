import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

interface Message {
  id: string;
  sender_type: 'organiser' | 'guest';
  sender_name: string;
  body: string;
  created_at: string;
}

interface Props {
  eventId: string;
}

export default function MessagingPanel({ eventId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () =>
    api.getMessages(eventId)
      .then(msgs => setMessages(msgs as Message[]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await api.sendMessage(eventId, body);
      setBody('');
      await load();
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-[#9cb092]/5 border border-[#9cb092]/20 mt-3 flex flex-col" style={{ height: 360 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#9cb092]/20 flex items-center justify-between">
        <p className="font-display text-[9px] tracking-[0.3em] uppercase text-[#9cb092]">Guest Messages</p>
        <button
          onClick={load}
          className="font-display text-[8px] tracking-[0.15em] uppercase text-[#b2c3b1]/40 hover:text-[#9cb092] transition-colors flex items-center gap-1"
        >
          <span className="material-icons text-xs">refresh</span>
          Refresh
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-4 h-4 border border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="material-icons text-2xl text-[#9cb092]/20">chat_bubble_outline</span>
            <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/30">
              No messages yet
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender_type === 'organiser' ? 'items-end' : 'items-start'}`}
            >
              <p className="font-display text-[8px] tracking-[0.1em] uppercase text-[#b2c3b1]/35 mb-1">
                {msg.sender_name || (msg.sender_type === 'organiser' ? 'You' : 'Guest')} · {formatTime(msg.created_at)}
              </p>
              <div className={`px-3 py-2 max-w-[78%] ${
                msg.sender_type === 'organiser'
                  ? 'bg-[#9cb092]/20 border border-[#9cb092]/30'
                  : 'bg-[#b2c3b1]/8 border border-[#b2c3b1]/15'
              }`}>
                <p className="font-display text-xs text-[#e4eee1] leading-relaxed">{msg.body}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#9cb092]/20 flex gap-2 items-end">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message your guests… (Enter to send)"
          rows={1}
          className="flex-1 bg-transparent border border-[#9cb092]/30 px-3 py-2 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60 resize-none"
          style={{ minHeight: 36 }}
        />
        <button
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="px-4 py-2 bg-[#9cb092] hover:bg-[#9cb092]/90 disabled:bg-[#9cb092]/20 disabled:cursor-not-allowed transition-all font-display text-[9px] tracking-[0.2em] uppercase text-[#1a2418] flex-shrink-0"
        >
          {sending ? (
            <span className="w-3 h-3 border border-[#1a2418]/30 border-t-[#1a2418] rounded-full animate-spin inline-block" />
          ) : 'Send'}
        </button>
      </div>
    </div>
  );
}
