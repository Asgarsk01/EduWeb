import { supabase } from '../lib/supabase/client';
import type {
  CompiledSystemContext,
  CompiledSystemContextPayload,
  DailyMetricSnapshot,
  DocumentMasterContext,
  ProgramProgressContext,
} from '../types/ai.types';
import type { UserRole } from '../types/auth.types';

const CONTEXT_CACHE_TTL_MS = 30_000;

let cachedPayload: CompiledSystemContextPayload | null = null;
let cachedAt = 0;
let inFlightCompile: Promise<CompiledSystemContextPayload> | null = null;

const buildRoleCountSeed = (): Record<UserRole, number> => ({
  ADMIN: 0,
  MANAGEMENT: 0,
  OFFICER: 0,
});

const toProblemSummary = (rows: Array<{ bottleneck_category: string | null }>) => {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.bottleneck_category?.trim() || 'Unclassified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(counts).sort(([, leftCount], [, rightCount]) => rightCount - leftCount)
  );
};

const toStaffRoleSummary = (rows: Array<{ role: UserRole }>) =>
  rows.reduce<Record<UserRole, number>>((acc, row) => {
    acc[row.role] = (acc[row.role] ?? 0) + 1;
    return acc;
  }, buildRoleCountSeed());

const assertNoError = (label: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
};

const filterProgramProgressForActiveYear = (
  rows: ProgramProgressContext[],
  activeAcademicYearId: string | null
) => {
  if (!activeAcademicYearId) {
    return rows;
  }

  const filtered = rows.filter(
    (row) => row.academic_year_id === activeAcademicYearId || row.academic_year_id === null
  );

  return filtered.length > 0 ? filtered : rows;
};

const compileFreshContext = async (): Promise<CompiledSystemContextPayload> => {
  const startedAt = performance.now();

  try {
    const [
      managementKpisResult,
      programProgressResult,
      feeAgingResult,
      problemAreasResult,
      funnelMetricsResult,
      activeAcademicYearResult,
      institutionCountResult,
      campusCountResult,
      departmentCountResult,
      documentMastersResult,
      activeStaffResult,
      snapshotsResult,
    ] = await Promise.all([
      supabase.from('vw_management_kpis').select('*').maybeSingle(),
      supabase.from('vw_program_progress').select('*').order('program_name'),
      supabase.from('vw_ai_fee_aging').select('*').maybeSingle(),
      supabase.from('vw_problem_areas').select('bottleneck_category'),
      supabase.from('vw_funnel_metrics').select('*'),
      supabase.from('academic_years').select('*').eq('is_active', true).maybeSingle(),
      supabase.from('institutions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('campuses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('departments').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase
        .from('document_masters')
        .select('id, name, quota_req, course_level_req, is_mandatory')
        .eq('is_active', true)
        .order('name'),
      supabase.from('user_profiles').select('role').eq('status', 'ACTIVE'),
      supabase
        .from('daily_metric_snapshots')
        .select('snapshot_date, total_leads, total_locked, total_confirmed, created_at')
        .order('snapshot_date', { ascending: false })
        .limit(14),
    ]);

    assertNoError('Management KPIs query failed', managementKpisResult.error);
    assertNoError('Program progress query failed', programProgressResult.error);
    assertNoError('Fee aging query failed', feeAgingResult.error);
    assertNoError('Problem area query failed', problemAreasResult.error);
    assertNoError('Funnel metrics query failed', funnelMetricsResult.error);
    assertNoError('Active academic year query failed', activeAcademicYearResult.error);
    assertNoError('Institution count query failed', institutionCountResult.error);
    assertNoError('Campus count query failed', campusCountResult.error);
    assertNoError('Department count query failed', departmentCountResult.error);
    assertNoError('Document master query failed', documentMastersResult.error);
    assertNoError('Active staff query failed', activeStaffResult.error);
    assertNoError('Historical snapshot query failed', snapshotsResult.error);

    const activeAcademicYear = activeAcademicYearResult.data ?? null;
    const programProgress = filterProgramProgressForActiveYear(
      (programProgressResult.data ?? []) as ProgramProgressContext[],
      activeAcademicYear?.id ?? null
    );
    const historicalContext = [...((snapshotsResult.data ?? []) as DailyMetricSnapshot[])].sort((left, right) =>
      left.snapshot_date.localeCompare(right.snapshot_date)
    );

    const context: CompiledSystemContext = {
      adminContext: {
        activeAcademicYear,
        physicalScale: {
          institutions: institutionCountResult.count ?? 0,
          campuses: campusCountResult.count ?? 0,
          departments: departmentCountResult.count ?? 0,
        },
        documentRequirements: (documentMastersResult.data ?? []) as DocumentMasterContext[],
        activeStaffByRole: toStaffRoleSummary((activeStaffResult.data ?? []) as Array<{ role: UserRole }>),
      },
      officerContext: {
        bottlenecksByCategory: toProblemSummary(
          (problemAreasResult.data ?? []) as Array<{ bottleneck_category: string | null }>
        ),
        funnelMetrics: funnelMetricsResult.data ?? [],
      },
      managementContext: {
        kpis: managementKpisResult.data ?? null,
        programProgress,
        feeAging: feeAgingResult.data ?? null,
      },
      historicalContext,
    };

    const payload: CompiledSystemContextPayload = {
      context,
      contextJson: JSON.stringify(context),
      durationMs: performance.now() - startedAt,
    };

    if (payload.durationMs > 200) {
      console.warn(`AI context compilation exceeded target budget: ${payload.durationMs.toFixed(1)}ms`);
    }

    cachedPayload = payload;
    cachedAt = Date.now();
    return payload;
  } catch (error) {
    console.error('Failed to compile AI system context', error);
    throw new Error('Unable to compile live CRM context for AI Copilot.');
  }
};

export const aiContextService = {
  async compileSystemContext(): Promise<CompiledSystemContextPayload> {
    const now = Date.now();

    if (cachedPayload && now - cachedAt < CONTEXT_CACHE_TTL_MS) {
      return cachedPayload;
    }

    if (inFlightCompile) {
      return inFlightCompile;
    }

    inFlightCompile = compileFreshContext().finally(() => {
      inFlightCompile = null;
    });

    return inFlightCompile;
  },

  invalidateCache() {
    cachedPayload = null;
    cachedAt = 0;
  },
};
