import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/error-handler';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExamEngineProps {
  questions: Question[];
  studentName: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  onFinish: (result: any) => void;
}

export default function ExamEngine({ questions, studentName, totalQuestions, timeLimitMinutes, onFinish }: ExamEngineProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSubmitted = React.useRef(false);

  // Submit Logic
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || hasSubmitted.current) return;
    hasSubmitted.current = true;
    setIsSubmitting(true);

    let score = 0;
    let totalMarks = 0;

    questions.forEach((q, i) => {
      totalMarks += q.marks;
      if (userAnswers[i] === q.answer) {
        score += q.marks;
      }
    });

    const percentageValue = ((score / totalMarks) * 100).toFixed(1);

    const resultDataToSave = {
      studentName: studentName || 'Anonymous Student',
      score,
      total: totalMarks,
      percentage: `${percentageValue}%`,
      timestamp: serverTimestamp(),
      answers: userAnswers,
      questions: questions
    };

    try {
      if (auth.currentUser) {
        await addDoc(collection(db, 'exam_results'), resultDataToSave);
      }
      
      // Pass a clean object to the UI to avoid circular dependency errors (from serverTimestamp sentinel)
      // and ensure all nested objects like questions are also cleaned of complex types
      const uiResultData = {
        studentName: resultDataToSave.studentName,
        score: resultDataToSave.score,
        total: resultDataToSave.total,
        percentage: resultDataToSave.percentage,
        timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
        answers: { ...resultDataToSave.answers },
        questions: resultDataToSave.questions.map(q => ({
          ...q,
          // Ensure nested Timestamps from Firestore don't cause issues
          createdAt: q.createdAt ? { seconds: (q.createdAt as any).seconds, nanoseconds: (q.createdAt as any).nanoseconds } : undefined
        }))
      };
      
      onFinish(uiResultData);
    } catch (error) {
      // Allow retry if it fails
      hasSubmitted.current = false;
      setIsSubmitting(false);
      handleFirestoreError(error, 'create', 'exam_results');
    }
  }, [isSubmitting, questions, userAnswers, studentName, onFinish]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePick = (ans: string) => {
    setUserAnswers({ ...userAnswers, [currentIdx]: ans });
  };

  const q = questions[currentIdx];

  return (
    <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
      {/* Left Column: Stats */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
        {/* Timer Bento */}
        <div className="bg-surface border border-border rounded-3xl p-8 flex flex-col items-center justify-center flex-1 text-center shadow-xl">
          <span className="text-text-dim text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} /> সময় বাকি (Time Left)
          </span>
          <div className={`text-6xl font-black font-mono transition-colors duration-500 ${timeLeft < 60 ? "text-danger animate-pulse" : "text-accent"}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="w-full bg-surface-hover h-2.5 rounded-full mt-8 overflow-hidden border border-border/50">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / (timeLimitMinutes * 60)) * 100}%` }}
              className={`h-full shadow-[0_0_15px_rgba(37,99,235,0.4)] ${timeLeft < 60 ? 'bg-danger' : 'bg-accent'}`}
            />
          </div>
        </div>
        
        {/* Progress Bento */}
        <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col gap-4 shadow-lg">
          <div className="flex justify-between items-end">
            <span className="text-text-dim text-[10px] font-bold uppercase tracking-widest">অগ্রগতি (Progress)</span>
            <span className="text-success font-black text-lg">
              {Object.keys(userAnswers).length} <span className="text-text-dim text-xs font-medium">/ {questions.length}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 min-w-[20px] rounded-full transition-all duration-500 ${
                  i === currentIdx ? 'bg-accent scale-y-150' : userAnswers[i] ? 'bg-success' : 'bg-surface-hover border border-border'
                }`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center Column: Question Engine */}
      <div className="col-span-12 lg:col-span-6 bg-surface border-2 border-accent/20 rounded-3xl p-6 md:p-10 flex flex-col relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <CheckCircle size={200} />
        </div>

        <div className="flex items-center gap-3 mb-8">
          <span className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-xs font-black border border-accent/20 shadow-sm">
            প্রশ্ন নং {currentIdx + 1}
          </span>
          <span className="bg-gold/10 text-gold px-3 py-1.5 rounded-full text-[10px] font-black border border-gold/20 uppercase tracking-widest">
            {q.marks} Mark{q.marks !== 1 ? 's' : ''}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-2xl md:text-3xl font-bold leading-relaxed text-text-main mb-12">
              {q.text}
            </h2>
            
            <div className="grid gap-4">
              {(['A', 'B', 'C', 'D'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => handlePick(key)}
                  className={`flex items-center gap-5 p-5 border-2 rounded-2xl transition-all duration-300 group text-left relative overflow-hidden ${
                    userAnswers[currentIdx] === key 
                      ? 'border-accent bg-accent/10 shadow-[0_0_25px_rgba(37,99,235,0.15)]' 
                      : 'border-transparent bg-surface-hover hover:border-border hover:bg-surface-hover/80'
                  }`}
                >
                  <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-300 ${
                    userAnswers[currentIdx] === key 
                      ? 'bg-accent text-white rotate-12 scale-110' 
                      : 'bg-border text-text-dim group-hover:bg-accent/20 group-hover:text-accent group-hover:-rotate-6'
                  }`}>
                    {key === 'A' ? 'ক' : key === 'B' ? 'খ' : key === 'C' ? 'গ' : 'ঘ'}
                  </div>
                  <span className={`text-lg font-medium transition-colors ${userAnswers[currentIdx] === key ? 'text-text-main' : 'text-text-dim group-hover:text-text-main'}`}>
                    {q.options[key]}
                  </span>
                  {userAnswers[currentIdx] === key && (
                    <motion.div layoutId="selection-glow" className="absolute inset-0 bg-accent/5 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="mt-12 flex justify-between pt-8 border-t border-border/50">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="px-8 py-4 bg-surface-hover border border-border rounded-2xl font-bold hover:bg-border transition-all disabled:opacity-20 active:scale-95"
          >
            আগের (Prev)
          </button>
          
          {currentIdx === questions.length - 1 ? (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-4 bg-success text-white rounded-2xl font-black hover:bg-success/80 shadow-lg shadow-success/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'প্রক্রিয়াকরণ...' : 'জমা দিন (Submit)'}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="px-8 py-4 bg-accent text-white rounded-2xl font-black hover:bg-accent/80 shadow-lg shadow-accent/20 transition-all active:scale-95"
            >
              পরের (Next)
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Navigation Grid */}
      <div className="col-span-12 lg:col-span-3 bg-surface border border-border rounded-3xl p-8 overflow-hidden flex flex-col shadow-xl">
        <h3 className="text-text-dim text-[10px] font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
          <LayoutDashboard size={14} /> প্রশ্ন নেভিগেশন (Navigation)
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-full aspect-square rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 relative ${
                i === currentIdx 
                  ? 'bg-accent text-white ring-4 ring-accent/20 shadow-lg scale-110 z-10' 
                  : userAnswers[i] 
                    ? 'bg-success text-white shadow-md shadow-success/10' 
                    : 'bg-surface-hover border border-border text-text-dim hover:border-accent/50'
              }`}
            >
              {i + 1}
              {userAnswers[i] && ! (i === currentIdx) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-success rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-auto pt-8 border-t border-border/50 flex flex-col gap-3">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-danger/10 text-danger border border-danger/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-danger hover:text-white transition-all mb-4"
          >
            {isSubmitting ? 'প্রক্রিয়াকরণ...' : 'পরীক্ষা শেষ করুন (Finish)'}
          </button>
          
          <div className="flex items-center gap-3 text-xs font-bold text-text-dim">
            <div className="w-4 h-4 bg-success rounded-md shadow-sm"></div>
            <span>উত্তর দেওয়া হয়েছে (Answered)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-text-dim">
            <div className="w-4 h-4 bg-accent rounded-md shadow-sm"></div>
            <span>বর্তমান প্রশ্ন (Current)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-text-dim">
            <div className="w-4 h-4 bg-surface-hover border border-border rounded-md shadow-sm"></div>
            <span>বাকি আছে (Pending)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

