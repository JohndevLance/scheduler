import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, Users, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocations } from '@/hooks/useLocations';
import {
  useOvertimeSummary,
  useOvertimeAlerts,
  useLaborCost,
  useCoverage,
  useUtilization,
} from '@/hooks/useAnalytics';

const AnalyticsPage = () => {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [locationId, setLocationId] = useState('');

  const { data: locations = [], isLoading: locLoading } = useLocations();
  const activeLocationId = locationId || locations[0]?.id || '';
  const weekStartIso = format(weekStart, 'yyyy-MM-dd');
  const monthStart = format(weekStart, 'yyyy-MM-01');
  const monthEnd = format(addDays(new Date(format(weekStart, 'yyyy-MM-01')), 34), 'yyyy-MM-01');

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));

  const { data: utilization, isLoading: utilLoading } = useUtilization(activeLocationId, weekStartIso);
  const { data: overtimeSummary = [], isLoading: otSumLoading } = useOvertimeSummary(activeLocationId, weekStartIso);
  const { data: overtimeAlerts = [], isLoading: otAlertLoading } = useOvertimeAlerts(activeLocationId);
  const { data: laborCost = [], isLoading: laborLoading } = useLaborCost(activeLocationId, monthStart, monthEnd);
  const { data: coverage = [], isLoading: covLoading } = useCoverage(activeLocationId, weekStartIso);

  const totalCoverageGaps = coverage.reduce(
    (acc, day) => acc + (day.totalSlotsNeeded - day.totalAssigned),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Week of {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Location picker */}
          {locLoading ? (
            <Skeleton className="h-9 w-44" />
          ) : (
            <select
              value={activeLocationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-9 rounded-md border border-input bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
          {/* Week nav */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium">{format(weekStart, 'MMM d')}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {utilLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {utilization?.utilizationPct != null ? utilization.utilizationPct.toFixed(0) : '—'}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {utilization?.fullyStaffedShifts}/{utilization?.totalShifts} shifts fully staffed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Coverage Gaps</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {covLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <p className={`text-3xl font-bold ${totalCoverageGaps > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {totalCoverageGaps}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">unfilled slots this week</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Overtime Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {otAlertLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <p className={`text-3xl font-bold ${overtimeAlerts.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {overtimeAlerts.length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">staff at risk (≥35 h)</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">Staff Scheduled</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            {otSumLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{overtimeSummary.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">members with shifts</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hours per staff bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Scheduled Hours — This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {otSumLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : overtimeSummary.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No data for this week.</p>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={overtimeSummary} margin={{ top: 4, right: 8, left: -16, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey={(d) => `${d.firstName} ${d.lastName.charAt(0)}.`}
                    tick={{ fontSize: 11 }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [`${v} hrs`, 'Scheduled']}
                    labelFormatter={(l) => l}
                  />
                  <Bar dataKey="scheduledHours" radius={[4, 4, 0, 0]}>
                    {overtimeSummary.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.scheduledHours >= 35 ? '#f97316' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Labor cost chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Labor Cost — Regular vs Premium hrs</CardTitle>
          </CardHeader>
          <CardContent>
            {laborLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : laborCost.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No labor cost data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={laborCost} margin={{ top: 4, right: 8, left: -16, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey={(d) => `${d.firstName} ${d.lastName.charAt(0)}.`}
                    tick={{ fontSize: 11 }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [`${v} hrs`, n === 'regularHours' ? 'Regular' : 'Premium']} />
                  <Bar dataKey="regularHours" name="Regular" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="premiumHours" name="Premium" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coverage gaps detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Coverage Gaps — Daily Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {covLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : coverage.every((d) => d.understaffedShifts === 0) ? (
            <p className="text-sm text-gray-400 text-center py-6">No coverage gaps this week 🎉</p>
          ) : (
            <div className="space-y-3">
              {coverage
                .filter((day) => day.understaffedShifts > 0)
                .map((day) => {
                  const gap = day.totalSlotsNeeded - day.totalAssigned;
                  return (
                    <div key={day.date}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        {format(new Date(day.date + 'T00:00:00'), 'EEEE')} — {format(new Date(day.date + 'T00:00:00'), 'MMM d')}
                      </p>
                      <div
                        className="flex items-center justify-between rounded-md border border-red-100 bg-red-50 px-3 py-2"
                      >
                        <span className="text-xs text-gray-700">
                          {day.understaffedShifts} of {day.totalShifts} shift{day.totalShifts !== 1 ? 's' : ''} understaffed
                        </span>
                        <Badge variant="destructive" className="text-[10px]">
                          {day.totalAssigned}/{day.totalSlotsNeeded} — {gap} open
                        </Badge>
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overtime alerts detail */}
      {overtimeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Overtime Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {overtimeAlerts.map((alert) => (
                <div key={alert.userId} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.firstName} {alert.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {alert.upcomingShifts} upcoming shift{alert.upcomingShifts !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    {alert.scheduledHours.toFixed(1)} hrs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
