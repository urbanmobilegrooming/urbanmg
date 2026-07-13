export type Role = "admin" | "manager" | "groomer" | "receptionist" | "staff";

// Which sidebar items each role can see
export const roleAccess: Record<Role, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/pets",
    "/dashboard/services",
    "/dashboard/appointments",
    "/dashboard/staff",
    "/dashboard/waitlist",
    "/dashboard/rebooking",
    "/dashboard/billing",
    "/dashboard/routes",
    "/dashboard/payroll",
    "/dashboard/reports",
    "/dashboard/messages",
    "/dashboard/agreements",
    "/dashboard/products",
    "/dashboard/discounts",
    "/dashboard/users",
    "/dashboard/settings",
  ],
  manager: [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/pets",
    "/dashboard/services",
    "/dashboard/appointments",
    "/dashboard/staff",
    "/dashboard/waitlist",
    "/dashboard/rebooking",
    "/dashboard/billing",
    "/dashboard/routes",
    "/dashboard/reports",
    "/dashboard/messages",
    "/dashboard/agreements",
    "/dashboard/products",
    "/dashboard/discounts",
    "/dashboard/settings",
  ],
  receptionist: [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/pets",
    "/dashboard/services",
    "/dashboard/appointments",
    "/dashboard/waitlist",
    "/dashboard/rebooking",
    "/dashboard/routes",
    "/dashboard/settings",
  ],
  groomer: [
    "/dashboard",
    "/dashboard/appointments",
    "/dashboard/routes",
    "/dashboard/settings",
  ],
  staff: [
    "/dashboard",
    "/dashboard/appointments",
    "/dashboard/settings",
  ],
};

export function canAccess(role: Role, path: string): boolean {
  const allowed = roleAccess[role] ?? [];
  return allowed.some((p) => path === p || path.startsWith(p + "/"));
}

export const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  manager: "Manager",
  groomer: "Groomer",
  receptionist: "Receptionist",
  staff: "Staff",
};

export const roleColors: Record<Role, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  groomer: "bg-green-100 text-green-700",
  receptionist: "bg-blue-100 text-blue-700",
  staff: "bg-gray-100 text-gray-600",
};
