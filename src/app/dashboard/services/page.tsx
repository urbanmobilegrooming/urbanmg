import { ServicesManager } from "@/components/services/ServicesManager";
import { listCategories, listServices } from "@/server/services";

export default async function ServicesPage() {
  const [categories, services] = await Promise.all([listCategories(), listServices()]);

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-inter)] text-2xl font-bold text-gray-900">
        Services
      </h1>
      <ServicesManager categories={categories} services={services} />
    </div>
  );
}
