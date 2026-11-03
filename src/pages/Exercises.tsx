import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, Dumbbell, Flame, Play, Search } from "lucide-react";
import { getWorkouts } from "../api/data";
import type { Workout } from "../types";
import Page from "../components/Page";
import { ErrorScreen, errorMessage } from "../components/PageState";
import { Skeleton } from "../components/Skeleton";
import { chip, inputClass } from "../ui";

const categories = ["strength", "cardio", "flexibility", "hiit"];

function WorkoutCard({ workout, tone }: { workout: Workout; tone: number }) {
  const navigate = useNavigate();
  const pink = tone % 2 === 0;
  return (
    <button
      onClick={() => navigate(`/workout?w=${workout.id}`)}
      className={`w-full flex items-center gap-4 p-4 rounded-3xl text-left active:scale-[0.99] transition ${
        pink ? "bg-brand-50" : "bg-mint-50"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-extrabold text-ink truncate">{workout.name}</p>
        </div>
        <p className="text-xs text-muted capitalize mt-0.5">
          {workout.muscle_group.replace("_", " ")},{" "}
          {workout.equipment === "none" ? "no equipment" : workout.equipment}
        </p>
        <p className="text-sm text-ink/70 mt-2 line-clamp-2">{workout.instructions}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white text-xs font-bold text-ink">
            <Clock size={12} /> {workout.duration_mins} min
          </span>
          <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white text-xs font-bold text-ink">
            <Flame size={12} /> {workout.calories_estimate} kcal
          </span>
          <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-white text-xs font-bold text-ink capitalize">
            {workout.difficulty}
          </span>
        </div>
      </div>
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
          pink ? "bg-brand-500" : "bg-mint-500"
        }`}
      >
        <Play size={18} fill="currentColor" />
      </span>
    </button>
  );
}

function ExercisesSkeleton() {
  return (
    <Page>
      <h1 className="text-2xl font-extrabold text-ink mb-5">Exercises</h1>

      {/* Search box */}
      <Skeleton className="h-12 rounded-2xl mb-4" />

      {/* Category / equipment tabs */}
      <Skeleton className="h-12 rounded-2xl mb-5" />

      {/* Filter chips */}
      <div className="flex gap-2 overflow-hidden -mx-5 px-5 mb-5">
        {[14, 20, 20, 24, 16].map((w, i) => (
          <Skeleton key={i} className="h-9 rounded-full flex-shrink-0" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      {/* Exercise cards */}
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-white shadow-card">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2 mt-2" />
              <Skeleton className="h-3 w-full mt-3" />
              <Skeleton className="h-3 w-4/5 mt-2" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
          </li>
        ))}
      </ul>
    </Page>
  );
}

export default function Exercises() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState<"category" | "equipment">("category");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getWorkouts()
      .then(setWorkouts)
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ExercisesSkeleton />;
  if (loadError) return <ErrorScreen message={loadError} />;

  const needle = query.trim().toLowerCase();
  const matchesQuery = (w: Workout) =>
    needle === "" ||
    w.name.toLowerCase().includes(needle) ||
    w.muscle_group.replace("_", " ").includes(needle) ||
    w.equipment.toLowerCase().includes(needle);

  const equipment = [...new Set(workouts.map((w) => w.equipment))].sort();
  const byCategory = workouts.filter(
    (w) => (categoryFilter === "" || w.category === categoryFilter) && matchesQuery(w)
  );
  const byEquipment = workouts.filter((w) => w.equipment === selectedEquipment && matchesQuery(w));
  const searching = needle !== "";

  return (
    <Page>
      <h1 className="text-2xl font-extrabold text-ink mb-5">Exercises</h1>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises, muscles or equipment"
          aria-label="Search exercises"
          className={`${inputClass} pl-11 bg-white shadow-card border-transparent`}
        />
      </div>

      <div className="grid grid-cols-2 bg-white rounded-2xl p-1 shadow-card mb-5" role="tablist">
        <button
          role="tab"
          aria-selected={viewMode === "category"}
          onClick={() => {
            setViewMode("category");
            setSelectedEquipment(null);
          }}
          className={`h-10 rounded-xl text-sm font-bold transition ${
            viewMode === "category" ? "bg-brand-500 text-white" : "text-ink/60"
          }`}
        >
          By category
        </button>
        <button
          role="tab"
          aria-selected={viewMode === "equipment"}
          onClick={() => setViewMode("equipment")}
          className={`h-10 rounded-xl text-sm font-bold transition ${
            viewMode === "equipment" ? "bg-brand-500 text-white" : "text-ink/60"
          }`}
        >
          By equipment
        </button>
      </div>

      {viewMode === "category" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 mb-5">
            <button onClick={() => setCategoryFilter("")} className={chip(categoryFilter === "")}>
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`${chip(categoryFilter === cat)} capitalize`}
              >
                {cat}
              </button>
            ))}
          </div>
          {byCategory.length === 0 ? (
            <p className="text-muted text-sm">Nothing matches that search.</p>
          ) : (
            <ul className="space-y-3">
              {byCategory.map((w, i) => (
                <li key={w.id}>
                  <WorkoutCard workout={w} tone={i} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {viewMode === "equipment" && !selectedEquipment && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {equipment
              .filter((eq) => !searching || workouts.some((w) => w.equipment === eq && matchesQuery(w)))
              .map((eq) => (
                <button
                  key={eq}
                  onClick={() => setSelectedEquipment(eq)}
                  className="bg-white rounded-3xl shadow-card p-4 text-left active:scale-[0.98] transition"
                >
                  <span className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
                    <Dumbbell size={20} />
                  </span>
                  <p className="font-extrabold text-ink capitalize leading-tight">
                    {eq === "none" ? "No equipment" : eq}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {workouts.filter((w) => w.equipment === eq).length} exercises
                  </p>
                </button>
              ))}
          </div>
        </>
      )}

      {viewMode === "equipment" && selectedEquipment && (
        <>
          <button
            onClick={() => setSelectedEquipment(null)}
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 mb-3"
          >
            <ChevronLeft size={16} /> All equipment
          </button>
          <h2 className="text-xl font-extrabold text-ink capitalize mb-4">
            {selectedEquipment === "none" ? "No equipment" : selectedEquipment}
          </h2>
          {byEquipment.length === 0 ? (
            <p className="text-muted text-sm">Nothing matches that search.</p>
          ) : (
            <ul className="space-y-3">
              {byEquipment.map((w, i) => (
                <li key={w.id}>
                  <WorkoutCard workout={w} tone={i} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Page>
  );
}
