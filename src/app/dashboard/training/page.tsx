import { TrainingClient } from "@/components/training/TrainingClient";
import { listTrainingModules } from "@/server/training";

export const metadata = { title: "Training" };

export default async function TrainingPage() {
  const modules = await listTrainingModules();
  return (
    <div className="p-6">
      <TrainingClient initialModules={modules} />
    </div>
  );
}
