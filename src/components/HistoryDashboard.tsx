import React from 'react';
import { ExamResult } from '../types';
import { motion } from 'motion/react';
import { Trophy, Target, Award, TrendingUp, Users, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface HistoryDashboardProps {
  history: ExamResult[];
  onViewDetails: (result: ExamResult) => void;
}

export default function HistoryDashboard({ history, onViewDetails }: HistoryDashboardProps) {
  // Calculations
  const totalExams = history.length;
  const avgScore = totalExams > 0 
    ? (history.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / totalExams).toFixed(1) 
    : 0;
  
  const topScore = totalExams > 0 
    ? Math.max(...history.map(h => parseFloat(h.percentage))).toFixed(1) 
    : 0;

  const passCount = history.filter(h => parseFloat(h.percentage) >= 70).length;
  const passRate = totalExams > 0 ? ((passCount / totalExams) * 100).toFixed(1) : 0;

  // Chart Data (Last 10 exams)
  const chartData = [...history]
    .slice(0, 10)
    .reverse()
    .map((h, i) => ({
      name: `Ex ${history.length - 9 + i > 0 ? history.length - 9 + i : i + 1}`,
      score: parseFloat(h.percentage),
      student: h.studentName
    }));

  return (
    <div className="space-y-8 pb-20">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Assessments', value: totalExams, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Average Precision', value: `${avgScore}%`, icon: Target, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Peak Performance', value: `${topScore}%`, icon: Trophy, color: 'text-gold', bg: 'bg-gold/10' },
          { label: 'Success Rate', value: `${passRate}%`, icon: Award, color: 'text-accent2', bg: 'bg-accent2/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-border p-6 rounded-3xl shadow-xl hover:border-accent/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <TrendingUp size={16} className="text-text-dim opacity-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mb-1">{stat.label}</p>
            <h3 className={`text-3xl font-black italic ${stat.color}`}>{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Performance Graph */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black italic flex items-center gap-3">
              <TrendingUp className="text-accent" /> Efficiency Matrix
            </h3>
            <span className="text-[10px] font-black uppercase text-text-dim tracking-widest bg-surface-hover px-4 py-2 rounded-full border border-border">Temporal Data Analysis</span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                />
                <YAxis 
                  hide
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#2563eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="var(--color-accent)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity List */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 bg-surface border border-border rounded-[2.5rem] p-8 shadow-2xl flex flex-col"
        >
          <h3 className="text-xl font-black italic mb-8 flex items-center gap-3">
            <Calendar className="text-accent" /> Recent Logs
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {history.slice(0, 6).map((res, i) => (
              <div 
                key={res.id || i}
                onClick={() => onViewDetails(res)}
                className="group cursor-pointer bg-surface-hover border border-border hover:border-accent/40 p-4 rounded-2xl transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center font-black text-accent text-xs">
                    {res.studentName[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-main group-hover:text-accent transition-colors">{res.studentName}</h4>
                    <p className="text-[10px] text-text-dim font-black uppercase">{res.percentage}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-text-dim group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center py-20 text-text-dim text-xs italic opacity-40">No records to display.</div>
            )}
          </div>
          <button className="mt-8 text-[10px] font-black uppercase text-accent hover:underline flex items-center justify-center gap-2">
            View Complete Archive
          </button>
        </motion.div>
      </div>

      {/* Main Records Grid */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black italic flex items-center gap-3 px-4">
          <Target className="text-accent" /> Detailed Archives
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((res, i) => (
            <motion.div 
              key={res.id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onClick={() => onViewDetails(res)}
              className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent2 text-white flex items-center justify-center text-2xl font-black shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                  {res.studentName[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xl tracking-tight text-text-main group-hover:text-accent transition-colors">{res.studentName}</h4>
                  <p className="text-[10px] text-text-dim uppercase font-black flex items-center gap-1.5 mt-1">
                    <Calendar size={10} /> {res.timestamp ? new Date(res.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex items-end justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Accuracy Rating</p>
                  <div className="text-gold font-black text-4xl italic leading-none">{res.percentage}</div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Verification</p>
                  <div className={`mt-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase ring-1 ring-inset ${parseFloat(res.percentage) >= 70 ? 'bg-success/10 text-success ring-success/20' : 'bg-danger/10 text-danger ring-danger/20'}`}>
                    {parseFloat(res.percentage) >= 70 ? 'Certified' : 'Under Review'}
                  </div>
                </div>
              </div>

              {/* Background Accents */}
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <ShieldCheck size={80} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
