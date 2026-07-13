import { TrainingClient } from "@/components/training/TrainingClient";
import { listTrainingModules } from "@/server/training";

export default async function TrainingPage() {
  const modules = await listTrainingModules();
  return (
    <div className="p-6">
      <TrainingClient initialModules={modules} />
    </div>
  );
}
