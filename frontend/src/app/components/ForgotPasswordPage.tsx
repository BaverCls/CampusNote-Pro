import { useState } from 'react';
import { Shield, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthService } from '../services/AuthService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FR-ST-04: The system shall provide a password reset link via email
      const success = await AuthService.forgotPassword(email);

      if (success) {
        setSubmitted(true);
        toast.success('Reset link sent to your email!');
      } else {
        toast.error('Could not send reset link. Please check your email.');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">CampusNote Pro</h1>
          <p className="text-slate-600 dark:text-slate-400">Password Recovery</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {!submitted ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h2>
                <p className="text-sm text-slate-500">Enter your university email address and we'll send you a link to reset your password.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@arel.edu.tr"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check Your Email</h2>
              <p className="text-sm text-slate-500 mb-8">
                We've sent a password reset link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Return to Login
              </button>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-sm">
            <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
