"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Target, Trash2, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Goal, GoalType, GOAL_TYPE_META,
  loadGoals, saveGoals, createGoal,
  progressPercent, projectedCompletionDate, isOnTrack,
} from "@/lib/goals";

const DEFAULT_DEADLINE = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().split("T")[0];
};

function GoalForm({ onSave, onCancel }: { onSave: (g: Goal) => void; onCancel: () => void }) {
  const [type, setType] = useState<GoalType>("savings");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [monthly, setMonthly] = useState("");
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const meta = GOAL_TYPE_META[type];
    onSave(createGoal({
      type,
      name: name || meta.label,
      targetAmount: parseFloat(target) || 0,
      currentAmount: parseFloat(current) || 0,
      monthlyContribution: parseFloat(monthly) || 0,
      deadline,
    }));
  }

  const meta = GOAL_TYPE_META[type];

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-6 space-y-4">
      <h3 className="text-white font-semibold">New Goal</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(GOAL_TYPE_META) as GoalType[]).map((t) => {
          const m = GOAL_TYPE_META[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                type === t
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-[#1e2d4a] hover:border-slate-600"
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              <p className="text-xs text-white font-medium mt-1">{m.label}</p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">{meta.description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Goal Name</label>
          <input
            className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60"
            placeholder={meta.label}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Target Amount ($)</label>
          <input
            required
            type="number"
            min="0"
            className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60"
            placeholder="50000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Current Amount ($)</label>
          <input
            type="number"
            min="0"
            className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60"
            placeholder="0"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Monthly Contribution ($)</label>
          <input
            type="number"
            min="0"
            className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60"
            placeholder="500"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 block mb-1">Target Date</label>
          <input
            type="date"
            required
            className="w-full bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/60"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[#1e2d4a] text-slate-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
        >
          Save Goal
        </button>
      </div>
    </form>
  );
}

function GoalCard({ goal, onDelete, onUpdateCurrent }: {
  goal: Goal;
  onDelete: () => void;
  onUpdateCurrent: (amount: number) => void;
}) {
  const meta = GOAL_TYPE_META[goal.type];
  const pct = progressPercent(goal);
  const projected = projectedCompletionDate(goal);
  const onTrack = isOnTrack(goal);
  const done = pct >= 100;

  return (
    <div className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{meta.emoji}</span>
          <div>
            <p className="font-semibold text-white">{goal.name}</p>
            <p className="text-xs text-slate-500">{meta.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {!done && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              onTrack ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}>
              {onTrack ? "On track" : "Behind"}
            </span>
          )}
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-[#1e2d4a] text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">{formatCurrency(goal.currentAmount)}</span>
          <span className="text-slate-400">{formatCurrency(goal.targetAmount)}</span>
        </div>
        <div className="h-2 bg-[#1e2d4a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: meta.color }}
          />
        </div>
        <p className="text-xs text-slate-500 text-right">{pct.toFixed(1)}% complete</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Remaining</p>
          <p className="text-white font-medium mt-0.5">
            {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Monthly</p>
          <p className="text-white font-medium mt-0.5">
            {goal.monthlyContribution > 0 ? formatCurrency(goal.monthlyContribution) : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Projected</p>
          <p className="text-white font-medium mt-0.5">
            {projected
              ? projected.toLocaleDateString("en-AU", { month: "short", year: "numeric" })
              : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          placeholder="Update current amount..."
          className="flex-1 bg-[#0a1222] border border-[#1e2d4a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/40"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = parseFloat((e.target as HTMLInputElement).value);
              if (!isNaN(val)) { onUpdateCurrent(val); (e.target as HTMLInputElement).value = ""; }
            }
          }}
        />
        <span className="text-xs text-slate-500">Press Enter</span>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setGoals(loadGoals()); }, []);

  function addGoal(g: Goal) {
    const updated = [...goals, g];
    setGoals(updated);
    saveGoals(updated);
    setShowForm(false);
  }

  function deleteGoal(id: string) {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
  }

  function updateCurrent(id: string, amount: number) {
    const updated = goals.map((g) => g.id === id ? { ...g, currentAmount: amount } : g);
    setGoals(updated);
    saveGoals(updated);
  }

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <div className="border-b border-[#1e2d4a] bg-[#0a1222]/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-[#1e2d4a] text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" /> Goals
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Goal
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Goals", value: goals.length.toString() },
              { label: "Total Target", value: formatCurrency(totalTarget) },
              { label: "Total Saved", value: formatCurrency(totalCurrent) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#1e2d4a] bg-[#0f1a2e] p-4">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {showForm && <GoalForm onSave={addGoal} onCancel={() => setShowForm(false)} />}

        {goals.length === 0 && !showForm && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span className="text-5xl">🎯</span>
            <h2 className="text-white font-semibold text-lg">No goals yet</h2>
            <p className="text-slate-500 text-sm max-w-xs">Set a savings target, mortgage payoff plan, or investment goal to start tracking your progress.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
            >
              Create your first goal
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={() => deleteGoal(goal.id)}
              onUpdateCurrent={(amt) => updateCurrent(goal.id, amt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
