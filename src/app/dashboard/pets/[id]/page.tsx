import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dog, Cat, Weight, Cake, User, ArrowLeft, Scissors, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PetVaccines } from "@/components/pets/PetVaccines";
import { PetPhotos } from "@/components/pets/PetPhotos";
import { PetMedical } from "@/components/pets/PetMedical";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { getPet, getVetInfo, listMedications, listPhotos, listVaccines } from "@/server/pets";
import { getClient } from "@/server/clients";
import { listAppointmentsForPet } from "@/server/appointments";

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
  const pet = await getPet(id);
  if (!pet) return { title: "Pet | urbanMG" };
  return { title: `${pet.name} (${pet.species}) | urbanMG` };
}

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pet = await getPet(id);
  if (!pet) notFound();

  const [vaccines, photos, appointments, owner, medications, vetInfo] = await Promise.all([
    listVaccines(id),
    listPhotos(id),
    listAppointmentsForPet(id, 30),
    pet.client_id ? getClient(pet.client_id) : Promise.resolve(null),
    listMedications(id),
    getVetInfo(id),
  ]);

  const age = pet.date_of_birth
    ? Math.floor((Date.now() - new Date(pet.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const completedAppts = appointments.filter((a) => a.status === "completed");
  const lastGroomed = completedAppts.length > 0 ? completedAppts[0] : null;

  return (
    <div className="space-y-6 p-6">
      <Link href={owner ? `/dashboard/clients/${owner.id}` : "/dashboard/pets"}>
        <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2C0F73]/10">
                {pet.species === "cat" ? <Cat className="h-8 w-8 text-[#2C0F73]" /> : <Dog className="h-8 w-8 text-[#2C0F73]" />}
              </div>
              <div>
                <CardTitle className="text-2xl">{pet.name}</CardTitle>
                <p className="text-sm text-gray-500">{pet.breed || pet.species}{pet.color && ` · ${pet.color}`}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {pet.weight_lbs && (
                <div className="rounded-lg border p-3 text-center">
                  <Weight className="mx-auto h-5 w-5 text-gray-400" />
                  <div className="mt-1 text-lg font-bold">{pet.weight_lbs}</div>
                  <div className="text-xs text-gray-500">lbs</div>
                </div>
              )}
              {age !== null && (
                <div className="rounded-lg border p-3 text-center">
                  <Cake className="mx-auto h-5 w-5 text-gray-400" />
                  <div className="mt-1 text-lg font-bold">{age}</div>
                  <div className="text-xs text-gray-500">years old</div>
                </div>
              )}
              {pet.gender && (
                <div className="rounded-lg border p-3 text-center">
                  <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${pet.gender === "male" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}>
                    {pet.gender === "male" ? "M" : "F"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 capitalize">{pet.gender}</div>
                </div>
              )}
              <div className="rounded-lg border p-3 text-center">
                <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${pet.is_neutered ? "bg-green-100" : "bg-gray-100"}`}>
                  {pet.is_neutered ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                </div>
                <div className="mt-1 text-xs text-gray-500">{pet.is_neutered ? "Neutered" : "Not neutered"}</div>
              </div>
            </div>

            {pet.temperament && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Temperament</h3>
                <p className="mt-1 text-sm text-gray-500">{pet.temperament}</p>
              </div>
            )}
            {pet.grooming_notes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Grooming Notes</h3>
                <p className="mt-1 text-sm text-gray-500">{pet.grooming_notes}</p>
              </div>
            )}
            {pet.medical_notes && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Medical Notes</h3>
                <p className="mt-1 text-sm text-gray-500">{pet.medical_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {owner && (
            <Card>
              <CardHeader><CardTitle className="text-base">Owner</CardTitle></CardHeader>
              <CardContent>
                <Link href={`/dashboard/clients/${owner.id}`} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2c037]/20">
                    <User className="h-5 w-5 text-[#f2c037]" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{owner.firstName} {owner.lastName}</div>
                    <div className="text-xs text-gray-500">{owner.phone}</div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Grooming Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total visits</span>
                <span className="font-bold text-gray-900">{completedAppts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total spent</span>
                <span className="font-bold text-[#f2c037]">
                  {formatCurrency(completedAppts.reduce((s, a) => s + (a.price || 0), 0))}
                </span>
              </div>
              {lastGroomed && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last groomed</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(lastGroomed.date)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PetVaccines petId={id} vaccines={vaccines} />
      <PetMedical petId={id} medications={medications} vetInfo={vetInfo} />
      <PetPhotos petId={id} photos={photos} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scissors className="h-5 w-5 text-[#2C0F73]" />
            Grooming History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!appointments || appointments.length === 0 ? (
            <p className="text-sm text-gray-400">No grooming history yet.</p>
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
                        {appt.start_time ? formatTime(appt.start_time) : ""}
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
