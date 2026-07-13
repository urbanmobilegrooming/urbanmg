import { SurveysClient } from "@/components/surveys/SurveysClient";
import { listSatisfactionSurveys } from "@/server/reviews";

export const metadata = { title: "Surveys" };

export default async function SurveysPage() {
  const surveys = await listSatisfactionSurveys();
  return (
    <div className="p-6">
      <SurveysClient surveys={surveys} />
    </div>
  );
}
