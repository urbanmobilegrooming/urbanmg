import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ArrowLeft, Calendar, DollarSign, Scissors } from "lucide-react";
import { ClientPets } from "@/components/clients/ClientPets";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { getClientWithDetails } from "@/server/clients";
import { listPetsByClient } from "@/server/pets";
import { listAppointmentsForClient } from "@/server/appointments";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-700",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientWithDetails(id);
  if (!client) return { title: "Client | urbanMG" };
  return { title: `${client.first_name} ${client.last_name} | urbanMG` };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, pets, appointments] = await Promise.all([
    getClientWithDetails(id),
    listPetsByClient(id),
    listAppointmentsForClient(id),
  ]);

  if (!client) notFound();

  const totalSpent = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.price || 0), 0);
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6 p-6">
      <Link href="/dashboard/clients">
        <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Clients</Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{client.first_name} {client.last_name}</CardTitle>
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              {client.phone}
              {client.phone_secondary && (
                <span className="text-gray-400">/ {client.phone_secondary}</span>
              )}
            </div>
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                {client.email}
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {client.address}, {client.city}, {client.state} {client.zip}
              </div>
            )}
          </div>
          {client.notes && (<p className="mt-4 text-sm text-gray-500">{client.notes}</p>)}

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <Calendar className="mx-auto h-5 w-5 text-[#2C0F73]" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">Visits</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <DollarSign className="mx-auto h-5 w-5 text-[#f2c037]" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <Scissors className="mx-auto h-5 w-5 text-[#1e73be]" />
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {completedCount > 0 ? formatCurrency(totalSpent / completedCount) : "$0"}
              </p>
              <p className="text-xs text-gray-500">Avg Ticket</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClientPets clientId={id} pets={pets} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-[#2C0F73]" />
            Appointment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!appointments || appointments.length === 0 ? (
            <p className="text-sm text-gray-400">No appointments yet.</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400">
                        {new Date(appt.date + "T00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(appt.date + "T00:00").getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appt.services?.name ?? "Service"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {appt.pets?.name ?? "Pet"} {appt.start_time ? `at ${formatTime(appt.start_time)}` : ""}
                        {appt.staff ? ` with ${appt.staff.first_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(appt.price)}
                    </span>
                    <Badge className={STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-700"}>
                      {appt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
