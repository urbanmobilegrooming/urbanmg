"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map } from "lucide-react";
import { RoutesView } from "./RoutesView";
import { RouteMap } from "./RouteMap";

interface Van {
  id: string;
  name: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
}

export function RoutesPageWrapper({
  appointments,
  staff,
  vans,
  today,
}: {
  appointments: any[];
  staff: any[];
  vans: Van[];
  today: string;
}) {
  return (
    <Tabs defaultValue="list">
      <TabsList>
        <TabsTrigger value="list"><List size={14} className="mr-1" /> Schedule</TabsTrigger>
        <TabsTrigger value="map"><Map size={14} className="mr-1" /> Map</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="mt-4">
        <RoutesView appointments={appointments} staff={staff} vans={vans} today={today} />
      </TabsContent>

      <TabsContent value="map" className="mt-4">
        <RouteMap appointments={appointments} />
      </TabsContent>
    </Tabs>
  );
}

