import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Question } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { Trash2, Plus, Download, LogOut, ShieldCheck, Shield, Users, UserPlus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'questions' | 'users'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    options: { A: '', B: '', C: '', D: '' },
    answer: 'A' as 'A' | 'B' | 'C' | 'D',
    marks: 1
  });

  const [userFormData, setUserFormData] = useState({
    userId: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Question)));
    });

    const u = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(u, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.userId || !userFormData.password || !userFormData.name) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'users'), {
        ...userFormData,
        createdAt: serverTimestamp()
      });
      setUserFormData({ userId: '', password: '', name: '' });
      alert('User account created successfully!');
    } catch (error) {
      handleFirestoreError(error, 'create', 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `users/${id}`);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text || !formData.options.A || !formData.options.B) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setFormData({
        text: '',
        options: { A: '', B: '', C: '', D: '' },
        answer: 'A',
        marks: 1
      });
    } catch (error) {
      handleFirestoreError(error, 'create', 'questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (error) {
      handleFirestoreError(error, 'delete', `questions/${id}`);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL questions? This cannot be undone.')) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'questions'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'write', 'questions');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoData = async () => {
    if (!confirm('Load 100 demo questions?')) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      for (let i = 0; i < 50; i++) { // Doing 50 for performance in one batch
        const qRef = doc(collection(db, 'questions'));
        batch.set(qRef, {
          text: `Sample Question ${i + 1} for CSA Exam. What is the standard protocol for incident response?`,
          options: { A: 'Preparation', B: 'Detection', C: 'Eradication', D: 'All of the above' },
          answer: 'D',
          marks: 1,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      alert('50 demo questions loaded!');
    } catch (error) {
      handleFirestoreError(error, 'write', 'questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex justify-between items-center bg-surface border border-border p-6 rounded-[2rem] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-accent" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight">Terminal Control</h2>
              <p className="text-[10px] text-text-dim uppercase font-bold tracking-widest">Admin Authorization Active</p>
            </div>
          </div>

          <div className="flex bg-surface-hover p-1 rounded-2xl border border-border">
            <button 
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'questions' ? 'bg-accent text-white shadow-lg' : 'text-text-dim hover:text-text-main'}`}
            >
              <Download size={14} /> Questions
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-accent text-white shadow-lg' : 'text-text-dim hover:text-text-main'}`}
            >
              <Users size={14} /> Users
            </button>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-xs font-bold text-text-dim hover:text-danger hover:bg-danger/10 border border-border px-4 py-2 rounded-xl transition-all">
          <LogOut size={14} /> Exit System
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'questions' ? (
          <motion.div 
            key="questions-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            <div className="md:col-span-12 lg:col-span-5 space-y-8">
              <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none rotate-12">
                  <Plus size={200} />
                </div>
                <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                  <Plus size={20} className="text-accent" /> Append Question
                </h3>
                <form onSubmit={handleAddQuestion} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Objective Text</label>
                    <textarea
                      value={formData.text}
                      onChange={e => setFormData({ ...formData, text: e.target.value })}
                      className="w-full bg-surface-hover border border-border rounded-2xl p-4 outline-none focus:border-accent transition-all min-h-[120px] font-medium"
                      placeholder="Enter evaluation criteria..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                      <div key={opt} className="space-y-2">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-wider">Option {opt}</label>
                        <input
                          type="text"
                          value={formData.options[opt]}
                          onChange={e => setFormData({ ...formData, options: { ...formData.options, [opt]: e.target.value } })}
                          className="w-full bg-surface-hover border border-border rounded-xl px-4 py-3 outline-none focus:border-accent transition-all text-sm font-medium"
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-dim uppercase tracking-wider">Verification Key</label>
                      <select
                        value={formData.answer}
                        onChange={e => setFormData({ ...formData, answer: e.target.value as any })}
                        className="w-full bg-surface-hover border border-border rounded-xl px-4 py-3 outline-none focus:border-accent transition-all appearance-none font-bold"
                      >
                        <option value="A">A (ক)</option>
                        <option value="B">B (খ)</option>
                        <option value="C">C (গ)</option>
                        <option value="D">D (ঘ)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-dim uppercase tracking-wider">Weight (Marks)</label>
                      <input
                        type="number"
                        value={formData.marks}
                        onChange={e => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })}
                        className="w-full bg-surface-hover border border-border rounded-xl px-4 py-3 outline-none focus:border-accent transition-all font-mono font-bold"
                        min="0.5"
                        step="0.5"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent2 text-white font-black py-5 rounded-2xl transition-all shadow-[0_15px_30px_rgba(37,99,235,0.2)] active:scale-95 disabled:opacity-50 text-sm uppercase tracking-[0.2em]"
                  >
                    COMMIT TO DATASTREAM
                  </button>
                </form>
              </div>
            </div>

            <div className="md:col-span-12 lg:col-span-7">
              <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col min-h-[600px]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black flex items-center gap-3 italic">
                    Question Inventory <span className="bg-accent/20 text-accent text-[10px] py-1 px-3 rounded-full font-black not-italic">{questions.length} Active</span>
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={handleLoadDemoData} disabled={loading} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-surface-hover border border-border hover:bg-accent/10 hover:text-accent px-4 py-2 rounded-xl transition-all">
                      <Download size={14} /> Batch Import
                    </button>
                    <button onClick={handleClearAll} disabled={loading} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 px-4 py-2 rounded-xl transition-all">
                      <Trash2 size={14} /> Wipe Bank
                    </button>
                  </div>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-3 custom-scrollbar">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-surface-hover border-l-4 border-accent border-y border-r border-border p-5 rounded-2xl flex justify-between items-center group hover:bg-surface-hover/80 transition-all shadow-sm">
                      <div className="space-y-3 flex-1">
                        <p className="text-sm font-bold leading-relaxed text-text-main pr-10">
                          <span className="text-accent/40 mr-2 font-mono">{questions.length - idx}.</span> {q.text}
                        </p>
                        <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest bg-surface/50 p-2 rounded-lg inline-flex border border-border/50">
                          <span className="text-success flex items-center gap-1"><div className="w-1.5 h-1.5 bg-success rounded-full" /> Key: {q.answer}</span>
                          <span className="text-gold flex items-center gap-1"><div className="w-1.5 h-1.5 bg-gold rounded-full" /> {q.marks} Mark</span>
                        </div>
                      </div>
                      <button onClick={() => q.id && handleDelete(q.id)} className="text-text-dim hover:text-danger p-3 bg-surface border border-border rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-md">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-text-dim border-2 border-dashed border-border rounded-[2rem]">
                       <Shield size={48} className="opacity-10 mb-4" />
                       <p className="italic font-medium">Stream clear. Awaiting objective population.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            <div className="md:col-span-12 lg:col-span-4 space-y-8">
              <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none rotate-12">
                  <UserPlus size={200} />
                </div>
                <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                  <UserPlus size={20} className="text-accent" /> Register Student
                </h3>
                <form onSubmit={handleAddUser} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Student Name</label>
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                      className="w-full bg-surface-hover border border-border rounded-2xl p-4 outline-none focus:border-accent transition-all font-medium"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">User ID (Login ID)</label>
                    <input
                      type="text"
                      value={userFormData.userId}
                      onChange={e => setUserFormData({ ...userFormData, userId: e.target.value })}
                      className="w-full bg-surface-hover border border-border rounded-2xl p-4 outline-none focus:border-accent transition-all font-mono font-bold"
                      placeholder="e.g. STU101"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Password</label>
                    <input
                      type="text"
                      value={userFormData.password}
                      onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                      className="w-full bg-surface-hover border border-border rounded-2xl p-4 outline-none focus:border-accent transition-all font-mono font-bold"
                      placeholder="Enter Password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent2 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 text-sm uppercase tracking-[0.2em]"
                  >
                    CREATE ACCOUNT
                  </button>
                </form>
              </div>
            </div>

            <div className="md:col-span-12 lg:col-span-8">
              <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col min-h-[600px]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black flex items-center gap-3 italic">
                    Registered Students <span className="bg-accent/20 text-accent text-[10px] py-1 px-3 rounded-full font-black not-italic">{users.length} Enrolled</span>
                  </h3>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-3 custom-scrollbar">
                  {users.map((u, idx) => (
                    <div key={u.id} className="bg-surface-hover border border-border p-6 rounded-3xl flex justify-between items-center group hover:border-accent/40 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-surface border border-border rounded-2xl flex items-center justify-center font-black text-accent shadow-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-text-main">{u.name}</h4>
                          <div className="flex gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-dim bg-surface px-2 py-0.5 rounded border border-border/50">ID: {u.userId}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-dim bg-surface px-2 py-0.5 rounded border border-border/50">PASS: {u.password}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => u.id && handleDeleteUser(u.id)} className="text-text-dim hover:text-danger p-3 bg-surface border border-border rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-md">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-text-dim border-2 border-dashed border-border rounded-[2rem]">
                       <Users size={48} className="opacity-10 mb-4" />
                       <p className="italic font-medium">No students registered yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

}
