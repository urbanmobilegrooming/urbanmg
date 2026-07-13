'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { staff, trainingModules, staffTrainingProgress } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type TrainingModuleRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  status?: string;
  completed_at?: string | null;
};

async function staffBelongsToBusiness(staffId: string, businessId: string) {
  const [s] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);
  return !!s;
}

export async function listTrainingModules(staffId?: string | null): Promise<TrainingModuleRow[]> {
  const { businessId } = await requireBusiness();
  const mods = await db
    .select()
    .from(trainingModules)
    .where(
      and(
        eq(trainingModules.businessId, businessId),
        eq(trainingModules.isActive, true),
      ),
    );

  let progressMap = new Map<string, { status: string; completedAt: Date | null }>();
  if (staffId && (await staffBelongsToBusiness(staffId, businessId))) {
    const rows = await db
      .select()
      .from(staffTrainingProgress)
      .where(eq(staffTrainingProgress.staffId, staffId));
    progressMap = new Map(rows.map((r) => [r.moduleId, { status: r.status, completedAt: r.completedAt }]));
  }

  return mods.map((m) => {
    const p = progressMap.get(m.id);
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      duration_minutes: m.durationMinutes,
      is_active: m.isActive,
      created_at: m.createdAt.toISOString(),
      status: p?.status ?? 'not_started',
      completed_at: p?.completedAt ? p.completedAt.toISOString() : null,
    };
  });
}

export async function createTrainingModule(input: {
  title: string;
  description?: string;
  category: string;
  duration_minutes: number;
}) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .insert(trainingModules)
    .values({
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      durationMinutes: input.duration_minutes,
      isActive: true,
      businessId,
    })
    .returning();
  revalidatePath('/dashboard/training');
  return row;
}

export async function setTrainingProgress(staffId: string, moduleId: string, status: string) {
  const { businessId } = await requireBusiness();
  // Verify staff and module both belong to this business
  if (!(await staffBelongsToBusiness(staffId, businessId))) {
    throw new Error('Staff not found');
  }
  const [mod] = await db
    .select({ id: trainingModules.id })
    .from(trainingModules)
    .where(
      and(
        eq(trainingModules.id, moduleId),
        eq(trainingModules.businessId, businessId),
      ),
    )
    .limit(1);
  if (!mod) throw new Error('Module not found');

  const existing = await db
    .select()
    .from(staffTrainingProgress)
    .where(and(eq(staffTrainingProgress.staffId, staffId), eq(staffTrainingProgress.moduleId, moduleId)))
    .limit(1);

  const completedAt = status === 'completed' ? new Date() : null;

  if (existing.length) {
    await db
      .update(staffTrainingProgress)
      .set({ status, completedAt })
      .where(eq(staffTrainingProgress.id, existing[0].id));
  } else {
    await db.insert(staffTrainingProgress).values({
      staffId,
      moduleId,
      status,
      completedAt,
    });
  }
  revalidatePath('/dashboard/training');
}
