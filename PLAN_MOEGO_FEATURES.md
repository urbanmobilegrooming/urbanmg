# UrbanMG - Plan de Features Faltantes vs MoeGo

## Estado Actual de UrbanMG

### Tablas existentes
- `profiles` - Auth users
- `clients` - Clientes básico (nombre, teléfono, email, dirección, notas)
- `pets` - Mascotas (especie, raza, peso, temperamento, notas médicas/grooming)
- `services` - Servicios con categorías
- `service_categories` - 5 categorías
- `service_pricing` - Precios por tamaño (small/medium/large/xl)
- `staff` - Staff con commission_rate y color
- `appointments` - Citas con van, dirección, pago básico
- `invoices` - Facturas básicas
- `expenses` - Gastos por categoría

### Páginas existentes
Dashboard, Appointments, Clients (+ detail), Pets (+ detail), Services, Staff, Billing, Payroll, Reports, Routes, Settings, Login

---

## FEATURES FALTANTES (ordenadas por prioridad)

---

### P0 - Crítico (sin esto no funciona el negocio)

#### 1. Calendario Visual de Citas
**MoeGo tiene:** Vista calendario por día/semana con drag & drop, vista por staff, colores por servicio/status
**UrbanMG tiene:** Solo lista de citas
**Tablas necesarias:** Ninguna nueva, solo UI
**Trabajo:**
- [ ] Componente calendario (vista día/semana)
- [ ] Vista por staff (columnas)
- [ ] Drag & drop para mover citas
- [ ] Color coding por status y servicio

#### 2. Check-in / Check-out Flow
**MoeGo tiene:** `PUT/grooming/appointment/checkin`, `PUT/grooming/appointment/checkout`, status flow completo
**UrbanMG tiene:** Status field pero sin flujo real
**Trabajo:**
- [ ] Botones de acción por status (confirm → check-in → in-progress → checkout → completed)
- [ ] Timestamps de check-in/check-out en appointments
- [ ] Notificación al completar

#### 3. Múltiples Servicios por Cita
**MoeGo tiene:** `PetDetail` model - cada cita puede tener múltiples pets con múltiples servicios cada uno
**UrbanMG tiene:** Solo 1 servicio por cita
**Tablas necesarias:**
```sql
CREATE TABLE appointment_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES appointments(id),
  pet_id uuid REFERENCES pets(id),
  service_id uuid REFERENCES services(id),
  staff_id uuid REFERENCES staff(id),
  price numeric NOT NULL,
  duration_minutes integer,
  status text DEFAULT 'pending',
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

#### 4. Múltiples Mascotas por Cita
**MoeGo tiene:** Una cita puede incluir varias mascotas del mismo dueño
**UrbanMG tiene:** Solo 1 pet por appointment
**Trabajo:**
- [ ] Cambiar relación a many-to-many via `appointment_services`
- [ ] UI para agregar múltiples pets al agendar

---

### P1 - Importante (mejora significativa de operación)

#### 5. Vacunas y Historial Médico
**MoeGo tiene:** `DELETE/customer/pet/vaccine/binding`, tracking de vacunas, alertas de vencimiento
**UrbanMG tiene:** Solo campo `medical_notes` en texto
**Tablas necesarias:**
```sql
CREATE TABLE pet_vaccines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid REFERENCES pets(id),
  vaccine_name text NOT NULL,
  date_given date,
  expiry_date date,
  vet_name text,
  document_url text,
  created_at timestamptz DEFAULT now()
);
```
**Trabajo:**
- [ ] CRUD vacunas por mascota
- [ ] Alerta de vacunas vencidas/por vencer
- [ ] Vista en perfil de mascota

#### 6. Fotos de Mascotas (Antes/Después)
**MoeGo tiene:** `POST/customer/pet/photo`, fotos por servicio
**UrbanMG tiene:** Solo `photo_url` (1 foto)
**Tablas necesarias:**
```sql
CREATE TABLE pet_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  photo_url text NOT NULL,
  photo_type text DEFAULT 'general' CHECK (photo_type IN ('before', 'after', 'general')),
  created_at timestamptz DEFAULT now()
);
```
**Trabajo:**
- [ ] Upload de fotos a Supabase Storage
- [ ] Galería en perfil de mascota
- [ ] Fotos before/after por cita

#### 7. Repeat Appointments (Citas Recurrentes)
**MoeGo tiene:** `POST/grooming/repeat/v2/rule`, `POST/grooming/repeat/v2/preview`, reglas de repetición semanales/mensuales
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE appointment_repeat_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  pet_id uuid REFERENCES pets(id),
  staff_id uuid REFERENCES staff(id),
  service_id uuid REFERENCES services(id),
  frequency text CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'custom')),
  interval_weeks integer DEFAULT 1,
  preferred_day integer, -- 0=Sunday, 6=Saturday
  preferred_time time,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```
**Trabajo:**
- [ ] Crear regla de repetición al agendar
- [ ] Job/cron para generar citas futuras
- [ ] UI para ver/editar reglas

#### 8. Wait List
**MoeGo tiene:** `POST/grooming/wait-list/list`, `POST/grooming/wait-list/smart`, `POST/grooming/wait-list/appointment`
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE wait_list (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  pet_id uuid REFERENCES pets(id),
  service_id uuid REFERENCES services(id),
  preferred_staff_id uuid REFERENCES staff(id),
  preferred_date_start date,
  preferred_date_end date,
  preferred_time_start time,
  preferred_time_end time,
  notes text,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'booked', 'cancelled')),
  created_at timestamptz DEFAULT now()
);
```

#### 9. Invoice Line Items
**MoeGo tiene:** `OrderLineItemModel` con unit_price, quantity, tax, discounts, extra_fees, tips separados
**UrbanMG tiene:** Solo totales en invoice (subtotal, tax, total)
**Tablas necesarias:**
```sql
CREATE TABLE invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES invoices(id),
  appointment_service_id uuid,
  description text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE invoice_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES invoices(id),
  amount numeric NOT NULL,
  payment_method text CHECK (payment_method IN ('zelle', 'cash', 'card', 'apple_pay', 'check', 'store_credit')),
  reference text,
  paid_at timestamptz DEFAULT now()
);
```

#### 10. Tips por Staff
**MoeGo tiene:** `POST/grooming/order/tip`, split tips entre múltiples staff
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE tips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES appointments(id),
  staff_id uuid REFERENCES staff(id),
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### 11. Descuentos y Códigos
**MoeGo tiene:** `DiscountCodeModel` con tipo (porcentaje/fijo/crédito), status, expiración, redeem types
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE discount_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  type text CHECK (type IN ('percentage', 'fixed', 'credit')),
  value numeric NOT NULL,
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  used_count integer DEFAULT 0,
  valid_from date,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

---

### P2 - Valor Agregado (diferenciadores)

#### 12. Mensajería / SMS
**MoeGo tiene:** Twilio completo - auto-replies, templates, reminders, batch sends, review booster
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE message_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text CHECK (type IN ('confirmation', 'reminder', 'followup', 'review', 'custom')),
  body text NOT NULL,
  is_active boolean DEFAULT true
);

CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  direction text CHECK (direction IN ('inbound', 'outbound')),
  channel text CHECK (channel IN ('sms', 'email', 'whatsapp')),
  body text NOT NULL,
  status text DEFAULT 'sent',
  template_id uuid REFERENCES message_templates(id),
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE reminder_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text CHECK (type IN ('appointment_confirmation', 'appointment_reminder', 'rebook', 'vaccine_expiry', 'review_request')),
  hours_before integer,
  template_id uuid REFERENCES message_templates(id),
  is_active boolean DEFAULT true
);
```

#### 13. Online Booking Portal
**MoeGo tiene:** Portal público completo con booking, client portal, agreements
**UrbanMG tiene:** Nada
**Trabajo:**
- [ ] Página pública `/book/[business-slug]`
- [ ] Selección de servicio → mascota → fecha/hora → confirmar
- [ ] Integración con disponibilidad real del calendario
- [ ] Email/SMS de confirmación

#### 14. Rutas y Optimización
**MoeGo tiene:** Route optimization, driving rules, MapBox integration, van management, áreas de servicio
**UrbanMG tiene:** Página de rutas pero sin funcionalidad real, vans hardcodeadas (Van 5, Van 7)
**Tablas necesarias:**
```sql
CREATE TABLE vans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  license_plate text,
  color text DEFAULT '#f2c037',
  is_active boolean DEFAULT true
);

CREATE TABLE route_stops (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  van_id uuid REFERENCES vans(id),
  appointment_id uuid REFERENCES appointments(id),
  stop_order integer NOT NULL,
  estimated_arrival time,
  actual_arrival time,
  lat numeric,
  lng numeric,
  drive_time_minutes integer,
  drive_distance_miles numeric
);
```
**Trabajo:**
- [ ] CRUD de vans dinámico (no hardcoded)
- [ ] Mapa con paradas del día
- [ ] Drag & drop para reordenar
- [ ] Geocoding de direcciones de clientes
- [ ] Optimización de ruta (Google Directions API o MapBox)

#### 15. Staff Working Hours / Availability
**MoeGo tiene:** `GET/business/staff/working/hour`, `PUT/business/staff/working/hour`, overrides por fecha, block time
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE staff_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES staff(id),
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true
);

CREATE TABLE staff_schedule_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES staff(id),
  date date NOT NULL,
  start_time time,
  end_time time,
  is_day_off boolean DEFAULT false,
  reason text
);

CREATE TABLE staff_block_times (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES staff(id),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  description text,
  color text DEFAULT '#cccccc'
);
```

#### 16. Clock In / Clock Out
**MoeGo tiene:** `POST/business/clockInOut`, `GET/business/clockInOut/log`, settings
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE clock_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES staff(id),
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  total_hours numeric,
  notes text
);
```

#### 17. Agreements y Formularios Digitales
**MoeGo tiene:** Templates de acuerdos, firma digital, formularios personalizados
**UrbanMG tiene:** Nada
**Tablas necesarias:**
```sql
CREATE TABLE agreement_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  body text NOT NULL,
  requires_signature boolean DEFAULT true,
  is_active boolean DEFAULT true
);

CREATE TABLE client_agreements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  template_id uuid REFERENCES agreement_templates(id),
  signature_url text,
  signed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired'))
);
```

#### 18. Payroll Calculation
**MoeGo tiene:** Payroll con excepciones, impuestos, reportes por staff, commission tracking
**UrbanMG tiene:** Página pero sin cálculo real
**Tablas necesarias:**
```sql
CREATE TABLE payroll_periods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid'))
);

CREATE TABLE payroll_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id uuid REFERENCES payroll_periods(id),
  staff_id uuid REFERENCES staff(id),
  total_services integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  tips_amount numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_pay numeric DEFAULT 0
);
```

---

### P3 - Nice to Have (features avanzadas)

#### 19. Notificaciones Push
**MoeGo tiene:** `POST/message/notification/app/push/token`, notificaciones móviles
**Tablas necesarias:**
```sql
CREATE TABLE push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  token text NOT NULL,
  platform text CHECK (platform IN ('web', 'ios', 'android')),
  created_at timestamptz DEFAULT now()
);
```

#### 20. Review Booster
**MoeGo tiene:** `POST/message/review/booster/save`, auto-envío de request de reseña después del servicio
**Trabajo:**
- [ ] Envío automático de link de Google Review post-servicio
- [ ] Tracking de reviews enviados/completados

#### 21. Client Portal
**MoeGo tiene:** Portal donde el cliente ve sus citas, mascotas, facturas, puede reservar
**Trabajo:**
- [ ] Página pública con login del cliente
- [ ] Ver próximas citas
- [ ] Ver historial de servicios
- [ ] Ver facturas

#### 22. Smart Schedule
**MoeGo tiene:** Auto-scheduling basado en reglas, driving distance, staff availability
**Trabajo:**
- [ ] Sugerencia automática de horarios basada en disponibilidad + ruta

#### 23. Pertenencias de Mascota
**MoeGo tiene:** `POST/customer/pet/pet-belongings` - tracking de collares, correas, etc. que deja el cliente
**Tabla:**
```sql
CREATE TABLE pet_belongings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  item_name text NOT NULL,
  returned boolean DEFAULT false,
  notes text
);
```

#### 24. Service Add-ons
**MoeGo tiene:** Add-ons por servicio con precio separado
**Tabla:**
```sql
CREATE TABLE service_addons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  duration_minutes integer DEFAULT 0,
  is_active boolean DEFAULT true
);
```

#### 25. Productos Retail
**MoeGo tiene:** `GET/retail/product/detail`, `GET/retail/product/query`, venta de productos
**Tabla:**
```sql
CREATE TABLE products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  sku text,
  price numeric NOT NULL,
  cost numeric DEFAULT 0,
  stock integer DEFAULT 0,
  category text,
  photo_url text,
  is_active boolean DEFAULT true
);
```

#### 26. Referral Program
**MoeGo tiene:** `GET/business/referral/info`, `GET/business/referral/bonusList`
**Tabla:**
```sql
CREATE TABLE referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_client_id uuid REFERENCES clients(id),
  referred_client_id uuid REFERENCES clients(id),
  bonus_amount numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
  created_at timestamptz DEFAULT now()
);
```

#### 27. Business Closed Dates / Holidays
**MoeGo tiene:** `GET/business/closedDate`, `GET/business/holiday/all`
**Tabla:**
```sql
CREATE TABLE business_closed_dates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  reason text,
  is_recurring_yearly boolean DEFAULT false
);
```

#### 28. Leaderboard / Staff Performance
**MoeGo tiene:** `GET/business/leaderboard/dashboard/insights/history`, ranking de staff
**Trabajo:**
- [ ] Dashboard con métricas por staff
- [ ] Revenue, # citas, tips, rating
- [ ] Ranking visual

---

## Resumen de Prioridades

| Prioridad | Features | Impacto |
|-----------|---------|---------|
| **P0** | Calendario visual, Check-in/out, Multi-servicio, Multi-pet | Sin esto no compites |
| **P1** | Vacunas, Fotos, Repeat appts, Wait list, Invoice items, Tips, Descuentos | Operación profesional |
| **P2** | SMS, Online booking, Rutas real, Staff hours, Clock in/out, Agreements, Payroll calc | Diferenciador |
| **P3** | Push, Reviews, Client portal, Smart schedule, Add-ons, Retail, Referrals | Nice to have |

## Total de tablas nuevas necesarias: ~25
## Total de features faltantes: 28

