import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Question, ExamResult, Page, UserAccount } from './types';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import ExamEngine from './components/ExamEngine';
import HistoryDashboard from './components/HistoryDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, History as HistoryIcon, PlayCircle, Loader2, AlertCircle, ShieldCheck, CheckCircle, User, Key, LogIn } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentAuth, setStudentAuth] = useState<UserAccount | null>(null);

  // Exam Config
  const [examConfig, setExamConfig] = useState({ count: 10, time: 20 });
  const [activeExamQuestions, setActiveExamQuestions] = useState<Question[]>([]);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        signInAnonymously(auth).catch(err => {
          console.warn("Anonymous auth restricted, continuing as guest:", err.message);
        });
      }
      setLoading(false);
    });

    const unsubQ = onSnapshot(collection(db, 'questions'), (snap) => {
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
    });

    const qHistory = query(collection(db, 'exam_results'), orderBy('timestamp', 'desc'), limit(50));
    const unsubH = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamResult)));
    });

    return () => {
      unsubAuth();
      unsubQ();
      unsubH();
    };
  }, []);

  const handleStartExam = () => {
    if (!studentAuth) {
      setCurrentPage('login');
      return;
    }
    if (questions.length === 0) {
      alert("No questions available in database!");
      return;
    }
    const count = Math.min(examConfig.count, questions.length);
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, count);
    setActiveExamQuestions(shuffled);
    setCurrentPage('exam');
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginId = (document.getElementById('stu-id') as HTMLInputElement).value;
    const loginPass = (document.getElementById('stu-pass') as HTMLInputElement).value;

    if (!loginId || !loginPass) return;

    try {
      setLoading(true);
      const q = query(collection(db, 'users'), where('userId', '==', loginId), where('password', '==', loginPass));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as UserAccount;
        setStudentAuth(userData);
        setCurrentPage('setup');
      } else {
        alert('Invalid Student ID or Password');
      }
    } catch (err) {
      console.error(err);
      alert('Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setStudentAuth(null);
    setCurrentPage('login');
  };

  const handleFinishExam = (result: ExamResult) => {
    setLastResult(result);
    setCurrentPage('result');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-accent" size={48} />
        <p className="text-text-dim font-bold animate-pulse">Initializing System...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans selection:bg-accent/30">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentPage === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto py-20">
              <div className="text-center mb-10 space-y-4">
                <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto border border-accent/20">
                  <User className="text-accent" size={40} />
                </div>
                <h1 className="text-4xl font-black italic text-text-main tracking-tight">Student Portal</h1>
                <p className="text-text-dim text-xs font-bold uppercase tracking-widest">Sign in to start session</p>
              </div>

              <div className="bg-surface border border-border p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                <form onSubmit={handleStudentLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Student ID</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                      <input 
                        id="stu-id"
                        type="text" 
                        placeholder="Enter your ID" 
                        className="w-full bg-surface-hover border border-border rounded-2xl p-4 pl-12 outline-none focus:border-accent transition-all font-mono font-bold" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Security Password</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                      <input 
                        id="stu-pass"
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full bg-surface-hover border border-border rounded-2xl p-4 pl-12 outline-none focus:border-accent transition-all font-mono font-bold" 
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-accent hover:bg-accent2 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                  >
                    <LogIn size={20} /> Authorize Access
                  </button>
                </form>
              </div>
              <div className="mt-8 text-center">
                 <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest italic">Request credentials from administrator</p>
              </div>
            </motion.div>
          )}

          {currentPage === 'admin' && (
            <div key="admin">
              {!isAdminAuth ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto py-20">
                  <div className="bg-surface border border-border p-8 rounded-3xl shadow-2xl space-y-6">
                    <h2 className="text-2xl font-bold text-center">Admin Login</h2>
                    <div className="space-y-4">
                      <input id="admin-user" type="text" placeholder="Username (User))" className="w-full bg-surface-hover border border-border rounded-xl p-3 outline-none focus:border-accent" />
                      <input id="admin-pass" type="password" placeholder="Password (Pass)" className="w-full bg-surface-hover border border-border rounded-xl p-3 outline-none focus:border-accent" />
                      <button 
                        onClick={() => {
                          const u = (document.getElementById('admin-user') as HTMLInputElement).value;
                          const p = (document.getElementById('admin-pass') as HTMLInputElement).value;
                          if (u === 'rakib' && p === '01710798934') setIsAdminAuth(true);
                          else alert('Invalid credentials');
                        }}
                        className="w-full bg-accent hover:bg-accent2 text-white font-bold py-3 rounded-xl transition-all"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <AdminPanel onLogout={() => setIsAdminAuth(false)} />
              )}
            </div>
          )}

          {currentPage === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto space-y-10 py-10">
              {!studentAuth ? (
                <div className="bg-surface border border-border p-10 rounded-[2.5rem] shadow-2xl text-center space-y-6">
                  <AlertCircle size={48} className="text-danger mx-auto" />
                  <h2 className="text-xl font-bold">Access Restricted</h2>
                  <p className="text-text-dim text-sm">You must enter your student credentials to access this section.</p>
                  <button onClick={() => setCurrentPage('login')} className="w-full bg-accent text-white py-4 rounded-xl font-bold">Go to Portal</button>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-3">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent italic tracking-tighter">TRY MCQ</h1>
                    <p className="text-text-dim text-xs font-bold uppercase tracking-[0.2em]">Welcome, {studentAuth?.name}</p>
                  </div>

                  <div className="bg-surface border border-border p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 p-4 opacity-10 group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0">
                      <PlayCircle size={200} />
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <h2 className="text-xl font-bold flex items-center gap-2">Exam Setup</h2>
                      <button onClick={handleLogout} className="text-[10px] font-black uppercase text-danger hover:underline">Log Out</button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Questions (Max {questions.length})</label>
                          <input 
                            value={examConfig.count}
                            onChange={e => setExamConfig({ ...examConfig, count: parseInt(e.target.value) || 0 })}
                            type="number" className="w-full bg-surface-hover border border-border rounded-2xl p-4 outline-none focus:border-accent font-mono font-bold" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Time (Minutes)</label>
                          <input 
                            value={examConfig.time}
                            onChange={e => setExamConfig({ ...examConfig, time: parseInt(e.target.value) || 0 })}
                            type="number" className="w-full bg-surface-hover border border-border rounded-2xl p-4 outline-none focus:border-accent font-mono font-bold" 
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleStartExam}
                        disabled={questions.length === 0}
                        className="w-full bg-accent hover:bg-accent2 text-white font-black py-5 rounded-2xl transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
                      >
                        START EXAMINATION 🚀
                      </button>
                      {questions.length === 0 && (
                        <p className="text-[10px] text-danger text-center font-bold flex items-center justify-center gap-1 uppercase">
                          <AlertCircle size={12} /> Database empty. Admin must add questions first.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {currentPage === 'exam' && (
            <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ExamEngine 
                questions={activeExamQuestions}
                studentName={studentAuth?.name || 'Anonymous'}
                totalQuestions={examConfig.count}
                timeLimitMinutes={examConfig.time}
                onFinish={handleFinishExam}
              />
            </motion.div>
          )}

          {currentPage === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <HistoryDashboard 
                history={history} 
                onViewDetails={(res) => {
                  setLastResult(res);
                  setCurrentPage('result');
                }}
              />
            </motion.div>
          )}

          {currentPage === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto py-10 space-y-10">
              <div className="bg-surface border border-border p-12 rounded-[3.5rem] shadow-2xl text-center space-y-8 relative overflow-hidden group">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute -top-20 -left-20 opacity-5 pointer-events-none"
                >
                  <Trophy size={300} />
                </motion.div>
                
                <Trophy className="mx-auto text-gold transition-all duration-500 group-hover:scale-125 group-hover:rotate-12" size={100} />
                
                <div className="space-y-4">
                  <h2 className="text-7xl font-black text-gold tracking-tighter drop-shadow-2xl">
                    {lastResult?.score} <span className="text-2xl text-text-dim -ml-2">/ {lastResult?.total}</span>
                  </h2>
                  <div className="space-y-1">
                    <p className="text-text-dim font-black uppercase tracking-[0.3em] text-xs">Final Score Issued</p>
                    <p className="text-success font-bold">Examination Successfully Recorded</p>
                  </div>
                </div>

                <div className="pt-10 flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <button 
                    onClick={() => setCurrentPage('setup')}
                    className="flex-1 bg-accent hover:bg-accent2 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm"
                  >
                    New Exam
                  </button>
                  <button 
                    onClick={() => setCurrentPage('history')}
                    className="flex-1 bg-surface-hover border border-border text-text-dim hover:text-text-main font-bold py-4 rounded-2xl transition-all"
                  >
                    Records
                  </button>
                </div>
              </div>

              {lastResult?.questions && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black italic flex items-center gap-3 px-4">
                    <ShieldCheck className="text-accent" /> Review Answers
                  </h3>
                  <div className="space-y-4">
                    {lastResult.questions.map((q, idx) => {
                      const userAns = lastResult.answers[idx];
                      const isCorrect = userAns === q.answer;
                      return (
                        <div key={idx} className={`bg-surface border-2 rounded-3xl p-6 transition-all ${isCorrect ? 'border-success/20' : 'border-danger/20'}`}>
                          <div className="flex items-start gap-4 mb-6">
                            <span className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-sm ${isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                              {idx + 1}
                            </span>
                            <h4 className="text-lg font-bold pt-1">{q.text}</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(['A', 'B', 'C', 'D'] as const).map(key => {
                              const isOptionCorrect = q.answer === key;
                              const isOptionUser = userAns === key;
                              
                              let statusClass = "bg-surface-hover border-border/50 text-text-dim";
                              if (isOptionCorrect) statusClass = "bg-success/10 border-success text-success font-bold";
                              if (isOptionUser && !isOptionCorrect) statusClass = "bg-danger/10 border-danger text-danger font-bold";

                              return (
                                <div key={key} className={`flex items-center gap-3 p-4 border-2 rounded-2xl ${statusClass}`}>
                                  <span className="text-xs font-black uppercase opacity-60">
                                    {key === 'A' ? 'ক' : key === 'B' ? 'খ' : key === 'C' ? 'গ' : 'ঘ'}
                                  </span>
                                  <span className="text-sm">{q.options[key]}</span>
                                  {isOptionCorrect && <CheckCircle size={14} className="ml-auto" />}
                                  {isOptionUser && !isOptionCorrect && <AlertCircle size={14} className="ml-auto" />}
                                </div>
                              );
                            })}
                          </div>
                          {!isCorrect && (
                            <div className="mt-4 p-3 bg-danger/5 border border-danger/10 rounded-xl text-xs font-bold text-danger text-center">
                              Wrong Answer! The correct option was {q.answer === 'A' ? 'ক' : q.answer === 'B' ? 'খ' : q.answer === 'C' ? 'গ' : 'ঘ'} ({q.answer})
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
