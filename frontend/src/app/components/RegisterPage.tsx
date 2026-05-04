import { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/AuthService';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Strictly enforce @arel.edu.tr domain
    if (!email.endsWith('@arel.edu.tr')) {
      setError('Registration is strictly limited to @arel.edu.tr domains.');
      return;
    }

    if (fullName.trim().length < 3) {
      setError('Please enter your full name (at least 3 characters).');
      return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true);
    const response = await AuthService.register(email, password, fullName);
    setLoading(false);

    if (response.success) {
      setSuccess('Account created successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(response.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl mb-6 transform hover:rotate-6 transition-transform">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Join CampusNote</h1>
          <p className="text-slate-600 dark:text-slate-400">Your academic legacy starts here</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 lg:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Name Surname"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                Institutional Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@arel.edu.tr"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all dark:text-white placeholder:text-slate-400"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                Only <span className="text-indigo-600 dark:text-indigo-400">@arel.edu.tr</span> addresses accepted
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                Choose Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-70 transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/25 mt-4"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Already a member? </span>
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-sm underline-offset-4 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
        
        <p className="mt-10 text-center text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-bold">
          Protected by CampusNote Security Protocol
        </p>
      </div>
    </div>
  );
}
