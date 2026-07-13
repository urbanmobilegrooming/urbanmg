import { ProductsManager } from "@/components/products/ProductsManager";
import { listProducts } from "@/server/products";
import { listAddons } from "@/server/services";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const [products, addons] = await Promise.all([listProducts(), listAddons()]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products & Add-ons</h1>
        <p className="text-sm text-gray-500">Retail products and service add-ons</p>
      </div>
      <ProductsManager products={products} addons={addons} />
    </div>
  );
}
