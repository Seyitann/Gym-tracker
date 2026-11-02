import { useEffect, useState } from "react";
import { getWorkouts } from "../api/data";
import type { Workout } from "../types";
import { ErrorScreen, LoadingScreen, errorMessage } from "../components/PageState";

const categories = ["strength", "cardio", "flexibility", "hiit"];

function pill(active: boolean) {
  return `px-4 py-2 rounded-full text-sm font-medium capitalize ${
    active ? "bg-yellow-400 text-gray-900" : "bg-gray-800 text-gray-300"
  }`;
}

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
      <div className="flex justify-between items-start gap-3 mb-2">
        <h3 className="text-lg font-semibold text-white">{workout.name}</h3>
        <span className="text-xs bg-gray-700 text-yellow-400 px-2 py-1 rounded-full capitalize flex-shrink-0">
          {workout.difficulty}
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-2">{workout.instructions}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>⏱ {workout.duration_mins} mins</span>
        <span>🔥 {workout.calories_estimate} cal</span>
        <span className="capitalize">🎯 {workout.muscle_group.replace("_", " ")}</span>
        <span className="capitalize">🧰 {workout.equipment}</span>
      </div>
    </div>
  );
}

export default function Exercises() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewMode, setViewMode] = useState<"category" | "equipment">("category");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  useEffect(() => {
    getWorkouts()
      .then(setWorkouts)
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (loadError) return <ErrorScreen message={loadError} />;

  const equipment = [...new Set(workouts.map((w) => w.equipment))].sort();
  const byCategory = categoryFilter
    ? workouts.filter((w) => w.category === categoryFilter)
    : workouts;
  const byEquipment = workouts.filter((w) => w.equipment === selectedEquipment);

  return (
    <div className="min-h-screen bg-gray-900 px-4 pt-8 pb-28">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Exercises</h1>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode("category");
              setSelectedEquipment(null);
            }}
            className={pill(viewMode === "category")}
          >
            By Category
          </button>
          <button onClick={() => setViewMode("equipment")} className={pill(viewMode === "equipment")}>
            By Equipment
          </button>
        </div>

        {viewMode === "category" && (
          <>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCategoryFilter("")} className={pill(categoryFilter === "")}>
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={pill(categoryFilter === cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {byCategory.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          </>
        )}

        {viewMode === "equipment" && !selectedEquipment && (
          <div className="grid grid-cols-2 gap-3">
            {equipment.map((eq) => (
              <button
                key={eq}
                onClick={() => setSelectedEquipment(eq)}
                className="bg-gray-800 rounded-2xl p-4 text-left hover:bg-gray-700 transition"
              >
                <p className="text-white font-semibold capitalize">{eq}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {workouts.filter((w) => w.equipment === eq).length} exercises
                </p>
              </button>
            ))}
          </div>
        )}

        {viewMode === "equipment" && selectedEquipment && (
          <>
            <button onClick={() => setSelectedEquipment(null)} className="text-yellow-400 text-sm">
              ‹ Back to equipment
            </button>
            <h2 className="text-xl font-semibold text-white capitalize">{selectedEquipment}</h2>
            <div className="space-y-3">
              {byEquipment.map((w) => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
