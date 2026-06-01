import { createContext, useContext, useState, type ReactNode } from 'react';

interface AdminCtx {
  secret: string;
  onUnauth: () => void;
}

export const AdminContext = createContext<AdminCtx>({ secret: '', onUnauth: () => {} });
export const useAdmin = () => useContext(AdminContext);

interface Props { children: ReactNode }

export default function AdminRoute({ children }: Props) {
  const [input, setInput] = useState('');
  const [entered, setEntered] = useState('');
  const [shake, setShake] = useState(false);

  const handleEnter = () => {
    if (!input.trim()) return;
    setEntered(input);
  };

  const handleUnauth = () => {
    setEntered('');
    setInput('');
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  if (!entered) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center px-6">
      <div className={`w-full max-w-xs transition-transform ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-10 h-10 border border-[#9cb092]/40 flex items-center justify-center">
            <span className="material-icons text-lg text-[#9cb092]/60">shield</span>
          </div>
        </div>

        <p className="font-display text-[10px] tracking-[0.35em] uppercase text-[#9cb092] mb-1 text-center">
          Admin Access
        </p>
        <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/30 mb-8 text-center">
          Enter your admin secret to continue
        </p>

        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEnter()}
          placeholder="••••••••••••"
          className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/20 focus:outline-none focus:border-[#9cb092]/60 mb-4 text-center tracking-widest"
        />

        <button
          onClick={handleEnter}
          disabled={!input.trim()}
          className="w-full py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]"
        >
          Enter
        </button>
      </div>
    </div>
  );

  return (
    <AdminContext.Provider value={{ secret: entered, onUnauth: handleUnauth }}>
      {children}
    </AdminContext.Provider>
  );
}
