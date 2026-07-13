"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Mail, Phone, Check } from "lucide-react";
import { toast } from "sonner";
import { type Role, roleLabels, roleColors } from "@/lib/roles";
import { toggleProfileActive, updateProfileRole } from "@/server/users";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: Date | string;
}

export function UsersManager({ profiles }: { profiles: Profile[] }) {
  const [roleEdit, setRoleEdit] = useState<{ id: string; role: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateRole(profileId: string, newRole: string) {
    setSaving(true);
    try {
      await updateProfileRole(profileId, newRole);
      toast.success("Role updated");
      setRoleEdit(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setSaving(false);
  }

  async function toggleActive(profileId: string, currentActive: boolean) {
    try {
      await toggleProfileActive(profileId, currentActive);
      toast.success(currentActive ? "User deactivated" : "User activated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.entries(roleLabels) as [Role, string][]).map(([role, label]) => (
          <Badge key={role} className={roleColors[role]}>
            {label}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-700">Permissions by Role</h3>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-semibold text-gray-500">Module</th>
                  <th className="py-2 text-center font-semibold text-gray-500">Admin</th>
                  <th className="py-2 text-center font-semibold text-gray-500">Manager</th>
                  <th className="py-2 text-center font-semibold text-gray-500">Receptionist</th>
                  <th className="py-2 text-center font-semibold text-gray-500">Groomer</th>
                  <th className="py-2 text-center font-semibold text-gray-500">Staff</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { module: "Dashboard", roles: [true, true, true, true, true] },
                  { module: "Clients", roles: [true, true, true, false, false] },
                  { module: "Pets", roles: [true, true, true, false, false] },
                  { module: "Services", roles: [true, true, true, false, false] },
                  { module: "Appointments", roles: [true, true, true, true, true] },
                  { module: "Staff", roles: [true, true, false, false, false] },
                  { module: "Billing", roles: [true, true, false, false, false] },
                  { module: "Routes", roles: [true, true, true, true, false] },
                  { module: "Payroll", roles: [true, false, false, false, false] },
                  { module: "Reports", roles: [true, true, false, false, false] },
                  { module: "Users", roles: [true, false, false, false, false] },
                ].map((row) => (
                  <tr key={row.module} className="border-b last:border-0">
                    <td className="py-1.5 font-medium text-gray-700">{row.module}</td>
                    {row.roles.map((has, i) => (
                      <td key={i} className="py-1.5 text-center">
                        {has ? (
                          <Check size={14} className="mx-auto text-green-500" />
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <h3 className="text-sm font-bold text-gray-700">{profiles.length} Users</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <Card key={p.id} className={`overflow-hidden ${!p.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2C0F73] text-sm font-bold text-white">
                    {p.full_name?.[0] ?? "?"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{p.full_name || "No name"}</h4>
                    <Badge className={roleColors[p.role as Role] ?? "bg-gray-100 text-gray-600"}>
                      {roleLabels[p.role as Role] ?? p.role}
                    </Badge>
                  </div>
                </div>
                {!p.is_active && (
                  <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {p.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={12} /> {p.email}
                  </div>
                )}
                {p.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={12} /> {p.phone}
                  </div>
                )}
                <div className="text-xs text-gray-300">
                  Since {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {roleEdit?.id === p.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Select value={roleEdit.role} onValueChange={(v) => setRoleEdit({ id: p.id, role: v ?? roleEdit.role })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="groomer">Groomer</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={saving} onClick={() => updateRole(p.id, roleEdit.role)} className="h-8 bg-[#f2c037] text-[#1a0a3e] hover:bg-[#e5a818]">Save</Button>
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setRoleEdit(null)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRoleEdit({ id: p.id, role: p.role })}>
                      <Shield size={12} className="mr-1" /> Change Role
                    </Button>
                    <Button size="sm" variant="outline" className={`h-7 text-xs ${p.is_active ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}`} onClick={() => toggleActive(p.id, p.is_active)}>
                      {p.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
