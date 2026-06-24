import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Camera, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Motion variants for stagger fade-in of login page elements
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 16 },
  },
};

export const Login: React.FC = () => {
  const { token, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // If already authenticated, redirect to Dashboard
  if (token) {
    return <Navigate to="/" replace />;
  }

  // Generate background particles on mount
  const particles = Array.from({ length: 15 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token: jwtToken, user } = res.data;
      login(jwtToken, user, rememberMe);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      triggerError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c081e] via-[#05020c] to-[#12021c] font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-violet-600/15 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-25%] w-[80%] h-[80%] rounded-full bg-fuchsia-600/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-rose-500/10 blur-[130px] pointer-events-none" />

      {/* Dynamic Floating Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {particles.map((_, i) => {
          const size = Math.random() * 20 + 8;
          const left = Math.random() * 100;
          const delay = Math.random() * 8;
          const duration = Math.random() * 10 + 10;
          return (
            <div
              key={i}
              className="particle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                bottom: '-20px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))'
              }}
            />
          );
        })}
      </div>

      {/* Main card wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-[1px] z-10 px-4 relative group"
      >
        {/* Breathing glowing border background effect */}
        <div className="absolute -inset-[2px] rounded-[32px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 opacity-25 group-hover:opacity-50 blur-[4px] transition duration-700 pointer-events-none animate-pulse" />
        
        {/* Outer sharp colored outline */}
        <div className="absolute -inset-px rounded-[31px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none" />

        <motion.div 
          animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="relative bg-[#0b0718]/85 backdrop-blur-2xl shadow-3xl rounded-[30px] p-8 border border-white/5 overflow-hidden"
        >
          {/* Logo Brand Header */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center mb-8 select-none"
          >
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-xl shadow-fuchsia-500/20 mb-4 transform hover:scale-105 hover:rotate-3 transition duration-300 cursor-pointer"
            >
              <Camera className="w-8 h-8" />
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300"
            >
              SD Digitals
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-[11px] font-bold text-fuchsia-400 mt-2 uppercase tracking-widest"
            >
              Client Account Manager
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit} 
            className="space-y-5"
          >
            
            {/* Email Input */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <div className="relative flex items-center group/input">
                <Mail className="absolute left-4 w-4.5 h-4.5 text-slate-500 group-focus-within/input:text-fuchsia-400 transition-colors duration-300" />
                <input
                  type="email"
                  required
                  placeholder="admin@sddigitals.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl text-sm bg-white/[0.03] border border-white/10 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 focus:outline-none text-white placeholder-slate-600 transition-all duration-300"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Account Password</label>
                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); alert('Please contact system administrator to reset password.'); }} 
                  className="text-[11px] font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors duration-200"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative flex items-center group/input">
                <Lock className="absolute left-4 w-4.5 h-4.5 text-slate-500 group-focus-within/input:text-fuchsia-400 transition-colors duration-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-10 rounded-xl text-sm bg-white/[0.03] border border-white/10 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 focus:outline-none text-white placeholder-slate-600 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Remember Me checkbox */}
            <motion.div variants={itemVariants} className="flex items-center justify-between py-0.5 select-none">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-350 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded-md border-white/10 bg-white/5 text-fuchsia-600 focus:ring-fuchsia-500/30 accent-fuchsia-500 focus:ring-offset-0 cursor-pointer"
                />
                Remember me
              </label>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-500 hover:shadow-xl hover:shadow-fuchsia-500/25 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 group transition-all duration-350 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-[0_4px_20px_rgba(217,70,239,0.15)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </>
              )}
            </motion.button>
          </motion.form>



        </motion.div>
      </motion.div>
    </div>
  );
};
