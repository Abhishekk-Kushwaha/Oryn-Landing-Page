import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays,
  Target,
  Flame,
  BarChart3,
  Check,
  ChevronRight,
  Zap,
  TrendingUp,
  Clock,
  Plus,
  ListTodo,
  ChevronLeft,
  GripVertical,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { BorderBeam } from "@/src/components/ui/border-beam";

// ─── Feature Data ─────────────────────────────────────────────────
const features = [
  {
    id: "focus",
    icon: CalendarDays,
    label: "Focus Mode",
    headline: "Your day, designed for action",
    description:
      "Wake up knowing exactly what to do. Drag tasks from your goals into today's plan — and crush them one by one.",
    bullets: [
      "Auto-prioritize tasks by deadline & goal urgency",
      "Focus Mode eliminates distractions",
      "Drag-and-drop scheduling",
    ],
  },
  {
    id: "planner",
    icon: ListTodo,
    label: "Daily Planner",
    headline: "Plan your day with precision",
    description:
      "Keep track of your daily tasks and schedule. Everything in one place.",
    bullets: [
      "Time blocking",
      "Task management",
      "Daily reflections",
    ],
  },
  {
    id: "goals",
    icon: Target,
    label: "Goal Tracking",
    headline: "See every goal's pulse, in real time",
    description:
      "Break massive ambitions into milestones and tasks. Oryn tracks progress automatically so you always know where you stand.",
    bullets: [
      "Visual progress rings for each goal",
      "Milestone tracking with deadlines",
      "Behind / On-Track / Ahead status",
    ],
  },
  {
    id: "habits",
    icon: Flame,
    label: "Habit Streaks",
    headline: "Consistency becomes visible",
    description:
      "Build unbreakable habits with streak tracking, heatmaps, and daily reminders that keep you accountable.",
    bullets: [
      "Contribution-style heatmap grid",
      "Streak counter with personal best",
      "Daily / weekly / custom frequency",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "Analytics",
    headline: "Proof you're improving — every week",
    description:
      "Compare this week to last. See completion rates, streak trends, and goal velocity at a glance.",
    bullets: [
      "Week-over-week comparison charts",
      "Habit completion rate trends",
      "Goal velocity scoring",
    ],
  },
];

function FocusMockup() {
  const focusTasks = [
    { label: "Morning Meditation", streak: "1 days", color: "emerald", bg: "bg-[#ecfdf5]", border: "border-[#a7f3d0]", iconColor: "text-[#10b981]" },
    { label: "Drink 2L Water", streak: "19 days", color: "emerald", bg: "bg-[#ecfdf5]", border: "border-[#a7f3d0]", iconColor: "text-[#10b981]" },
    { label: "Write Journal", streak: "2 days", color: "purple", bg: "bg-[#faf5ff]", border: "border-[#e9d5ff]", iconColor: "text-[#a855f7]" },
  ];

  return (
    <div className="w-full space-y-5">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between"
      >
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-800 leading-none tracking-tight">6/9</span>
            <span className="text-[15px] font-medium text-slate-500">complete</span>
          </div>
          <div className="text-[11px] sm:text-[13px] font-medium text-slate-400 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5 mt-1 sm:mt-0">
            <span>3 remaining</span>
            <span className="hidden sm:inline text-slate-300">·</span> 
            <span className="flex items-center text-emerald-500 font-semibold gap-1 sm:gap-0.5">
              <svg width="10" height="10" className="sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Ahead of <span className="text-slate-400 ml-0.5 font-medium">yesterday</span>
            </span>
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-800">67%</div>
      </motion.div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-[17px] font-bold text-slate-800 tracking-tight">Focus</h3>
        <span className="text-[13px] font-medium text-slate-400">3 open</span>
      </div>

      <div className="space-y-3">
        {focusTasks.map((task, i) => (
          <motion.div
            key={task.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="bg-white rounded-[18px] px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <div className={`shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center border ${task.bg} ${task.border} ${task.iconColor}`}>
                <Flame size={16} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] sm:text-[15px] font-bold text-slate-800 tracking-tight mb-0.5 truncate">
                  {task.label}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${task.color === 'emerald' ? 'bg-[#34d399]' : 'bg-[#a855f7]'}`} />
                  <span className="text-xs font-medium text-slate-400">
                    Habit streak: {task.streak}
                  </span>
                </div>
              </div>
            </div>
            <button className="shrink-0 ml-2 px-3 sm:px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors text-[12px] sm:text-[13px] font-semibold text-slate-500">
              Done
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PlannerMockup() {
  return (
    <div className="w-full bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        {/* Toggle */}
        <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5">
          <button className="bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-md px-2.5 py-1 text-[9px] font-bold tracking-widest text-slate-800">WEEK</button>
          <button className="px-2.5 py-1 text-[9px] font-bold tracking-widest text-slate-400 hover:text-slate-600 transition-colors">MONTH</button>
        </div>
        {/* Assign Tasks Button */}
        <button className="flex items-center gap-1 bg-orange-50/80 border border-orange-200/50 rounded-full px-3 py-1 text-orange-500 hover:bg-orange-100/50 transition-colors">
          <Plus size={10} strokeWidth={3} />
          <span className="text-[9px] font-bold tracking-widest">ASSIGN TASKS</span>
        </button>
      </div>

      {/* Sub Header (Week Date) */}
      <div className="px-5 pb-3 flex items-center gap-4">
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <div className="text-[11px] font-bold tracking-[0.15em] text-slate-900">WEEK OF JUN 1</div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="border-t border-slate-100" />

      {/* Days List */}
      <div className="flex flex-col">
        {/* MON 1 */}
        <div className="relative bg-slate-50/60 px-5 py-3.5 flex items-start sm:items-center gap-6 border-b border-slate-100/80 group">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500" />
          <div className="w-8 shrink-0 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-[0.15em] text-orange-500 mb-0.5">MON</span>
            <span className="text-[17px] font-bold text-slate-900 leading-none">1</span>
          </div>
          <button className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] tracking-widest hover:text-slate-500 transition-colors mt-1 sm:mt-0">
            <Plus size={12} strokeWidth={2.5} /> ADD TASK
          </button>
        </div>

        {/* TUE 2 */}
        <div className="px-5 py-3.5 flex items-start sm:items-center gap-6 border-b border-slate-100/80">
          <div className="w-8 shrink-0 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-[0.15em] text-slate-300 mb-0.5">TUE</span>
            <span className="text-[17px] font-bold text-slate-500 leading-none">2</span>
          </div>
        </div>

        {/* WED 3 */}
        <div className="px-5 py-3.5 flex items-start sm:items-center gap-6 border-b border-slate-100/80">
          <div className="w-8 shrink-0 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-[0.15em] text-slate-300 mb-0.5">WED</span>
            <span className="text-[17px] font-bold text-slate-500 leading-none">3</span>
          </div>
          <div className="flex-1 bg-slate-50/80 rounded-[10px] px-3 py-2.5 flex items-center gap-3 border border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing">
            <GripVertical size={14} className="text-slate-300/80 shrink-0" />
            <span className="text-[13px] font-semibold text-slate-700">Implement Authentication</span>
          </div>
        </div>

        {/* THU 4 */}
        <div className="px-5 py-3.5 flex items-start sm:items-center gap-6 border-b border-slate-100/80">
          <div className="w-8 shrink-0 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-[0.15em] text-slate-300 mb-0.5">THU</span>
            <span className="text-[17px] font-bold text-slate-500 leading-none">4</span>
          </div>
        </div>

        {/* FRI 5 */}
        <div className="px-5 py-3.5 flex items-start sm:items-center gap-6">
          <div className="w-8 shrink-0 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-[0.15em] text-slate-300 mb-0.5">FRI</span>
            <span className="text-[17px] font-bold text-slate-500 leading-none">5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsMockup() {
  const goals = [
    { name: "Learn React", pct: 72, color: "text-purple-500", track: "stroke-purple-200", fill: "stroke-purple-500", status: "On Track", statusColor: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { name: "Get Fit", pct: 31, color: "text-red-500", track: "stroke-red-200", fill: "stroke-red-500", status: "Behind", statusColor: "text-red-600 bg-red-50 border-red-100" },
    { name: "Read 24 Books", pct: 88, color: "text-blue-500", track: "stroke-blue-200", fill: "stroke-blue-500", status: "Ahead", statusColor: "text-blue-600 bg-blue-50 border-blue-100" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-black text-slate-800">Active Goals</div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3 active</span>
      </div>
      {goals.map((g, i) => {
        const radius = 18;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (g.pct / 100) * circ;
        return (
          <motion.div
            key={g.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.35 }}
            className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-3 border border-slate-200/60 shadow-sm"
          >
            <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
              <circle cx="22" cy="22" r={radius} fill="none" className={g.track} strokeWidth="4" />
              <circle
                cx="22" cy="22" r={radius} fill="none" className={g.fill} strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" transform="rotate(-90 22 22)"
              />
              <text x="22" y="23" textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-black fill-slate-700">
                {g.pct}%
              </text>
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800">{g.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${g.statusColor}`}>{g.status}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
          </motion.div>
        );
      })}
    </div>
  );
}

function HabitsMockup() {
  const staticCols = [
    [1, 1, 1, 1], // 1
    [1, 1, 1, 1], // 2
    [0, 1, 1, 1], // 3
    [1, 1, 0, 0], // 4
    [1, 1, 1, 1], // 5
    [1, 1, 1, 1], // 6
    [1, 1, 1, 1], // 7
    [0, 0, 0, 0], // 8
    [0, 0, 0, 1], // 9
    [1, 1, 1, 1], // 10
    [0, 1, 1, 1], // 11
    [1, 1, 1, 1], // 12
    [0, 0, 0, 0], // 13
    [1, 1, 1, 1], // 14
    [1, 1, 1, 0], // 15
    [1, 0, 0, 0], // 16
  ];

  return (
    <div className="bg-white rounded-[18px] p-4 md:p-5 w-full shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="shrink-0 w-[46px] h-[46px] rounded-2xl bg-[#d1fae5]/50 border border-emerald-100/50 flex items-center justify-center text-xl">
            🏃
          </div>
          <div className="min-w-0">
            <div className="text-[14px] sm:text-base font-bold text-slate-800 tracking-tight leading-tight truncate">
              Morning Meditation
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">
              Health · Daily
            </div>
          </div>
        </div>
        {/* Right Badge */}
        <div className="shrink-0 flex items-center gap-1 bg-[#d1fae5]/40 border border-emerald-200/60 rounded-xl px-1.5 sm:px-2 py-1 text-emerald-600">
          <span className="text-xs hidden sm:inline">🔥</span>
          <span className="text-[11px] sm:text-xs font-bold">↑ 42</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1.5 justify-between mb-6 overflow-hidden">
        {staticCols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1.5">
            {col.map((val, ri) => (
              <motion.div
                key={ri}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.03 * (ci + ri), duration: 0.2 }}
                className={`w-3 h-3 rounded-[3px] ${
                  val
                    ? "bg-[#34d399]"
                    : "bg-slate-100/80 border border-slate-200/50"
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12px] sm:text-[13px] font-bold text-[#10b981] truncate">
          85% <span className="text-slate-400 font-medium ml-0.5 sm:ml-1">this month</span>
        </div>
        <button className="shrink-0 flex items-center gap-1 bg-[#d1fae5]/40 hover:bg-[#d1fae5]/80 text-[#059669] border border-emerald-200/60 rounded-xl px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors">
          Mark complete <span className="text-[#059669] ml-0.5 sm:ml-1 font-bold">&gt;</span>
        </button>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  // Generate pseudo-random heatmap data for 26 columns, 7 rows
  // First 21 columns have data, last 5 are empty (0)
  const yearlyData = Array.from({ length: 26 }, (_, c) => {
    return Array.from({ length: 7 }, (_, r) => {
      if (c >= 21) return 0;
      const seed = Math.sin(c * 12.9898 + r * 78.233);
      const val = seed - Math.floor(seed); // 0 to 1
      if (val < 0.15) return 1; // orange
      if (val < 0.35) return 2; // yellow
      if (val < 0.7) return 3;  // light green
      return 4;                 // dark green
    });
  });

  const colors = [
    "bg-slate-50 border border-slate-100", // 0: empty
    "bg-[#fdba74]", // 1: orange-300
    "bg-[#fde047]", // 2: yellow-300
    "bg-[#6ee7b7]", // 3: emerald-300
    "bg-[#10b981]", // 4: emerald-500
  ];

  return (
    <div className="w-full space-y-4">
      {/* 2026 Yearly Heatmap */}
      <div className="bg-white rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">2026 at a glance</h2>
        </div>

        <div className="h-[1px] bg-slate-100 w-full mb-5" />

        <div className="relative mb-5">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[75%] h-[80%] bg-[#10b981]/20 blur-xl rounded-full mix-blend-multiply" />
          
          <div className="relative flex gap-[4px] overflow-hidden">
            {yearlyData.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[4px]">
                {col.map((val, ri) => (
                  <motion.div
                    key={ri}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.01 * (ci * 7 + ri), duration: 0.2 }}
                    className={`w-[10px] h-[10px] rounded-full ${colors[val]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-slate-100 w-full mb-4" />

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400">Less</span>
          <div className="flex gap-[5px]">
            {colors.map((c, i) => (
              <div key={i} className={`w-[10px] h-[10px] rounded-full ${c}`} />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400 ml-1">More</span>
        </div>
      </div>

      {/* Weekly Overview Header */}
      <div className="text-sm font-black text-slate-800 px-1 pt-2">Weekly Overview</div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Completion", value: "87%", change: "+12%", up: true },
          { label: "Streak", value: "42d", change: "+7d", up: true },
          { label: "Tasks Done", value: "31", change: "+8", up: true },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
            className="bg-white rounded-xl border border-slate-200/60 p-2.5 text-center shadow-sm"
          >
            <div className="text-lg font-black text-slate-800">{s.value}</div>
            <div className="text-[9px] text-slate-400 font-medium">{s.label}</div>
            <div className={`text-[9px] font-bold mt-0.5 ${s.up ? "text-emerald-500" : "text-red-500"}`}>
              <TrendingUp size={8} className="inline mr-0.5" />
              {s.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500">Task Completion</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span className="text-[8px] text-slate-400">Last week</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-[8px] font-bold text-slate-600">This week</span>
            </div>
          </div>
        </div>
        <svg viewBox="0 0 280 80" className="w-full h-auto">
          {/* Grid lines */}
          {[20, 40, 60].map((y) => (
            <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeOpacity="0.6" />
          ))}
          {/* Last week (pink dashed) */}
          <path
            d="M 0 55 C 20 55, 30 48, 47 48 C 64 48, 74 42, 93 42 C 112 42, 122 52, 140 52 C 158 52, 168 38, 187 38 C 206 38, 216 45, 233 45 C 252 45, 262 40, 280 40"
            fill="none" stroke="#ec4899" strokeWidth="1.8" strokeDasharray="3 3" strokeLinecap="round"
          />
          {/* This week (orange solid) */}
          <path
            d="M 0 48 C 20 48, 30 35, 47 35 C 64 35, 74 28, 93 28 C 112 28, 122 22, 140 22 C 158 22, 168 30, 187 30 C 206 30, 216 18, 233 18 C 252 18, 262 25, 280 25"
            fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"
          />
          {/* Dots */}
          {[
            [0, 48], [47, 35], [93, 28], [140, 22], [187, 30], [233, 18], [280, 25]
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="3" fill="#f97316" stroke="#fff" strokeWidth="1.2" />
          ))}
        </svg>
        <div className="flex justify-between mt-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <span key={d} className="text-[7px] text-slate-300 font-medium">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const mockupMap: Record<string, React.FC> = {
  focus: FocusMockup,
  planner: PlannerMockup,
  goals: GoalsMockup,
  habits: HabitsMockup,
  analytics: AnalyticsMockup,
};

// ─── Main Hero195 Feature Section ─────────────────────────────────
export function Hero195() {
  const [activeTab, setActiveTab] = React.useState("focus");

  return (
    <section id="features" className="bg-white pt-8 pb-20 md:pt-10 md:pb-28 overflow-hidden relative">
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        {/* Section badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <span className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-[0.2em] bg-orange-50 border border-orange-200/60 px-4 py-1.5 rounded-full">
            <Zap size={13} /> Features
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
            Everything you need to{" "}
            <span className="text-orange-500">stay consistent</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Goals, habits, daily planning, and analytics — working together so you never lose momentum.
          </p>
        </motion.div>

        {/* Tabs + Preview Card */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          {/* Tab buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <TabsList className="w-full max-w-2xl mx-auto flex bg-slate-100/80 rounded-xl p-1 gap-1 h-auto">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <TabsTrigger
                    key={f.id}
                    value={f.id}
                    className="flex-1 sm:min-w-[120px] flex items-center justify-center gap-2 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:shadow-slate-200/50 text-slate-500 hover:text-slate-700"
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline">{f.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </motion.div>

          {/* Tab content area */}
          <div className="mt-8 md:mt-10">
            {features.map((f) => (
              <TabsContent key={f.id} value={f.id} className="outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex justify-center">
                    {/* Mockup card with border beam */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="relative w-[calc(100%-1rem)] sm:w-full max-w-lg mx-auto mt-2"
                    >
                      {/* Decorative dashed frame */}
                      <div className="absolute -inset-2 sm:-inset-3 md:-inset-4 border border-dashed border-slate-200/60 rounded-2xl pointer-events-none" />
                      <div className="absolute -inset-6 md:-inset-8 border border-dashed border-slate-100/50 rounded-3xl pointer-events-none hidden md:block" />

                      {/* Main card */}
                      <div className="relative bg-slate-50 rounded-2xl border border-slate-200/70 p-3 sm:p-5 md:p-6 shadow-xl shadow-slate-200/30 overflow-hidden">
                        <BorderBeam
                          size={250}
                          duration={12}
                          borderWidth={1.5}
                          colorFrom="#f97316"
                          colorTo="#a855f7"
                          delay={0}
                        />
                        {/* Render the mockup for the active tab */}
                        {React.createElement(mockupMap[f.id])}
                      </div>

                      {/* Corner decorations */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-orange-300/50 rounded-tl-sm" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-orange-300/50 rounded-tr-sm" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-orange-300/50 rounded-bl-sm" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-orange-300/50 rounded-br-sm" />
                    </motion.div>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  );
}
