import React, { useState } from 'react';
import { useAuth, UserRole, User, ROLE_PERMISSIONS } from '../context/AuthContext';
import { CONFIG } from '../config';
import { useNotify } from '../context/NotificationContext';

export const LoginPage: React.FC = () => {
  const { login, users, registerUser } = useAuth();
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { notify } = useNotify();

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('waiter');
  const [regPin, setRegPin] = useState('');
  const [regEmoji, setRegEmoji] = useState('🛎️');

  const handleSelectUser = (user: User) => {
    setSelected(user);
    setPin('');
    setError('');
  };

  const handlePinPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      handleLogin(newPin);
    }
  };

  const handleLogin = async (inputPin: string) => {
    if (!selected) return;
    setIsLoggingIn(true);
    
    try {
      const res = await fetch(`${CONFIG.API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, pin: inputPin }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        notify(`Welcome back, ${data.user.name}!`, 'success');
      } else {
        const errorData = await res.json();
        setShaking(true);
        setError(errorData.error?.message || 'PIN 码错误');
        setTimeout(() => {
          setPin('');
          setError('');
          setShaking(false);
        }, 700);
      }
    } catch (err) {
      notify('Network error: Unable to reach login server', 'error');
      setPin('');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || regPin.length !== 4) return;

    try {
      await registerUser({
        name: regName,
        role: regRole,
        pin: regPin,
        emoji: regEmoji
      });
      notify('Staff member registered successfully', 'success');
      setIsRegistering(false);
      setRegName('');
      setRegPin('');
    } catch (err: any) {
      notify(err.message || 'Registration failed', 'error');
    }
  };

  const roleGradients: Record<UserRole, string> = {
    waiter: 'from-blue-500 to-blue-600',
    cashier: 'from-emerald-500 to-emerald-600',
    chef: 'from-amber-500 to-orange-500',
    boss: 'from-red-600 to-rose-600',
    admin: 'from-indigo-600 to-violet-600',
  };

  const roleColors: Record<UserRole, string> = {
    waiter: '#3B82F6',
    cashier: '#10B981',
    chef: '#F59E0B',
    boss: '#D32F2F',
    admin: '#4F46E5',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col items-center justify-start pt-16 p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Logo */}
      <div className="mb-6 text-center relative z-10">
        <div className="w-[60px] h-[60px] bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-red-900/50">
          <span className="text-white text-sm font-black tracking-tight">MUBIN</span>
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">Mubin.cafe.hogo</h1>
        <p className="text-slate-400 text-[10px] font-medium mt-1">Premium POS System · Select your role to login</p>
      </div>

      {!selected ? (
        /* User Selection Screen */
        <div className="relative z-10 w-full max-w-2xl">
          <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide pb-4">
            <div className={users.length === 0 ? "flex justify-center" : "grid grid-cols-2 gap-4"}>
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-3xl p-6 text-left transition-all duration-200 active:scale-95 backdrop-blur-sm"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg transition-transform duration-200 group-hover:scale-110 bg-gradient-to-br ${roleGradients[user.role]}`}
                  >
                    {user.emoji}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-1">{user.name}</h3>
                      <p className="text-slate-400 text-sm font-medium capitalize">{user.role}</p>
                    </div>
                    <span className="text-white/20 text-xs font-mono">#{user.id}</span>
                  </div>
                </button>
              ))}

              {/* Add Staff Button */}
              <button
                onClick={() => setIsRegistering(true)}
                className={`${users.length === 0 ? 'w-full max-w-sm h-48' : 'w-full'} bg-dashed-border group border-2 border-dashed border-white/10 hover:border-white/30 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-200 active:scale-95`}
                data-testid="add-staff"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl text-white/40 group-hover:text-white transition-colors">
                  +
                </div>
                <span className="text-white/40 group-hover:text-white font-bold transition-colors">Add New Staff</span>
              </button>
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-8">v1.1.0 · Mubin Restaurant POS</p>
        </div>
      ) : (
        /* PIN Entry Screen */
        <div className={`relative z-10 w-full max-w-xs ${shaking ? 'animate-shake' : ''}`}>
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold mb-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back</span>
          </button>

          <div className="text-center mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2 shadow-xl bg-gradient-to-br ${roleGradients[selected.role]}`}>
              {selected.emoji}
            </div>
            <h2 className="text-xl font-black text-white">{selected.name}</h2>
          </div>

          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pin.length ? 'scale-110' : 'bg-white/20'
                  }`}
                style={i < pin.length ? { background: roleColors[selected.role], boxShadow: `0 0 8px ${roleColors[selected.role]}80` } : {}}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-red-400 text-base font-bold mb-5 animate-fade">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                onClick={() => handlePinPress(d)}
                className="h-14 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-white text-xl font-bold transition-all duration-150 active:scale-95 backdrop-blur-sm"
                data-testid={`pin-${d}`}
              >
                {d}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinPress('0')}
              className="h-14 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-white text-xl font-bold transition-all duration-150 active:scale-95 backdrop-blur-sm"
              data-testid="pin-0"
            >
              0
            </button>
            <button
              onClick={() => setPin(p => p.slice(0, -1))}
              className="h-14 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 hover:border-white/20 rounded-xl text-slate-300 text-lg font-bold transition-all duration-150 active:scale-95 backdrop-blur-sm"
              data-testid="pin-backspace"
            >
              ⌫
            </button>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6">Register New Staff</h2>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">角色</label>
                  <select
                    value={regRole}
                    onChange={e => {
                      const role = e.target.value as UserRole;
                      setRegRole(role);
                      if (role === 'waiter') setRegEmoji('🛎️');
                      if (role === 'cashier') setRegEmoji('💳');
                      if (role === 'chef') setRegEmoji('👨‍🍳');
                      if (role === 'boss') setRegEmoji('👑');
                    }}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="waiter" className="bg-slate-900 text-white">服务员</option>
                    <option value="cashier" className="bg-slate-900 text-white">收营员</option>
                    <option value="chef" className="bg-slate-900 text-white">厨师</option>
                    <option value="boss" className="bg-slate-900 text-white">老板</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">PIN 码 (4位)</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={regPin}
                    onChange={e => setRegPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-widest focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="flex-1 py-4 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all"
                  data-testid="cancel-registration"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-xl bg-red-600 text-white font-black hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
                  data-testid="create-staff"
                >
                  创建员工
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
