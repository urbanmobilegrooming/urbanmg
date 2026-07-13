import type { LucideIcon } from "lucide-react";

// ── Shared join types ────────────────────────────────────────────────────────

export interface ClientRef {
  id?: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface PetRef {
  id: string;
  name: string;
  species?: string | null;
  breed?: string | null;
  weight_lbs?: number | null;
}

export interface ServiceRef {
  id: string;
  name: string;
  duration_minutes?: number | null;
  category?: string | null;
}

export interface StaffRef {
  id: string;
  first_name: string;
  last_name: string;
  color?: string | null;
}

// ── Appointment ──────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  van: string | null;
  price: number | null;
  notes: string | null;
  checkin_at: Date | string | null;
  checkout_at: Date | string | null;
  clients: ClientRef | null;
  pets: PetRef | null;
  services: ServiceRef | null;
  staff: StaffRef | null;
}

// ── Staff ────────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  color?: string | null;
  role?: string | null;
  commission_rate?: number;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}

// ── Messaging ────────────────────────────────────────────────────────────────

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  type?: string;
  channel?: string;
}

export interface Message {
  id: string;
  client_id?: string | null;
  template_id?: string | null;
  body?: string;
  direction?: string;
  status?: string | null;
  channel?: string;
  sent_at?: Date | string | null;
  created_at?: Date | string;
  clients?: ClientRef | null;
}

// ── Agreements ───────────────────────────────────────────────────────────────

export interface AgreementTemplate {
  id: string;
  name: string;
  body?: string;
  created_at?: Date | string;
}

export interface Agreement {
  id: string;
  client_id?: string;
  template_id?: string | null;
  signed_at?: Date | string | null;
  signature_url?: string | null;
  status?: string;
  created_at?: Date | string;
  clients?: ClientRef | null;
  agreement_templates?: AgreementTemplate | null;
}

// ── Status flow ──────────────────────────────────────────────────────────────

export interface StatusFlowStep {
  next: string;
  label: string;
  icon: LucideIcon;
}
