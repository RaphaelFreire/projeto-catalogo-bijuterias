'use client';

import { useEffect, useMemo, useState } from 'react';
import { Boxes, ClipboardList, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/shared/components/ui/card';
import { ComposedBarLineChart } from '@/shared/components/ui/composed-bar-line-chart';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { MetricCard } from '@/shared/components/ui/metric-card';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import { cn } from '@/shared/lib/class-name.util';
import {
  DashboardApiError,
  getDashboardSummary,
  listCriticalStock,
  listOrdersByPeriod,
  type CriticalStockItem,
  type DashboardSummary,
  type OrdersByPeriodPoint,
  type PeriodGranularity,
} from '../util/dashboard-api.util';

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const INTEGER_FORMATTER = new Intl.NumberFormat('pt-BR');

const GRANULARITY_OPTIONS: { value: PeriodGranularity; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

const TIME_ZONE = 'America/Sao_Paulo';

const DATE_FORMATTERS: Record<PeriodGranularity, Intl.DateTimeFormat> = {
  day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TIME_ZONE }),
  week: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TIME_ZONE }),
  month: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: TIME_ZONE }),
};

type ChartDatum = {
  periodStart: string;
  periodLabel: string;
  orderCount: number;
  revenue: number;
};

function formatPeriodLabel(periodStart: string, granularity: PeriodGranularity): string {
  const date = new Date(periodStart);
  const formatted = DATE_FORMATTERS[granularity].format(date);
  return granularity === 'week' ? `sem. ${formatted}` : formatted;
}

export default function DashboardComponent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [criticalStock, setCriticalStock] = useState<CriticalStockItem[]>([]);
  const [points, setPoints] = useState<OrdersByPeriodPoint[]>([]);
  const [granularity, setGranularity] = useState<PeriodGranularity>('day');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [summaryData, criticalStockData] = await Promise.all([
          getDashboardSummary(),
          listCriticalStock(5),
        ]);
        if (!cancelled) {
          setSummary(summaryData);
          setCriticalStock(criticalStockData);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DashboardApiError) {
          for (const code of error.errors) toast.error(getMessage(code));
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadChart() {
      setLoadingChart(true);
      setSelectedIndex(null);
      try {
        const data = await listOrdersByPeriod(granularity);
        if (!cancelled) setPoints(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DashboardApiError) {
          for (const code of error.errors) toast.error(getMessage(code));
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    }
    void loadChart();
    return () => {
      cancelled = true;
    };
  }, [granularity]);

  const chartData: ChartDatum[] = useMemo(
    () =>
      points.map((point) => ({
        periodStart: point.periodStart,
        periodLabel: formatPeriodLabel(point.periodStart, granularity),
        orderCount: point.orderCount,
        revenue: point.revenue,
      })),
    [points, granularity],
  );

  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;
  const averageTicket =
    selectedPoint && selectedPoint.orderCount > 0
      ? selectedPoint.revenue / selectedPoint.orderCount
      : 0;

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Dashboard"
        title="Visão geral da loja"
        subtitle="Indicadores de estoque e pedidos, atualizados ao carregar a página."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Estoque total"
          subtitle="Soma da quantidade de todos os produtos"
          value={loadingSummary ? '...' : INTEGER_FORMATTER.format(summary?.stock.totalQuantity ?? 0)}
          icon={<Boxes />}
        />
        <MetricCard
          title="Total de pedidos"
          subtitle="Pedidos feitos na vitrine"
          value={loadingSummary ? '...' : INTEGER_FORMATTER.format(summary?.orders.totalOrders ?? 0)}
          icon={<ClipboardList />}
        />
        <MetricCard
          title="Faturamento"
          subtitle="Soma do valor de todos os pedidos"
          value={loadingSummary ? '...' : PRICE_FORMATTER.format(summary?.orders.totalRevenue ?? 0)}
          icon={<Wallet />}
        />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Pedidos por período</h3>
            <p className="text-xs text-muted-foreground">
              Clique numa barra para ver o detalhe do período.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-input p-1">
            {GRANULARITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGranularity(option.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  granularity === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loadingChart ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <ComposedBarLineChart
            data={chartData}
            xKey="periodLabel"
            barKey="orderCount"
            lineKey="revenue"
            barLabel="Pedidos"
            lineLabel="Faturamento"
            height={280}
            valueFormatter={(value, dataKey) =>
              dataKey === 'revenue' ? PRICE_FORMATTER.format(value) : INTEGER_FORMATTER.format(value)
            }
            onBarClick={(_, index) => setSelectedIndex(index)}
            selectedIndex={selectedIndex}
          />
        )}

        {selectedPoint ? (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Pedidos no período</p>
              <p className="text-lg font-semibold">{INTEGER_FORMATTER.format(selectedPoint.orderCount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faturamento no período</p>
              <p className="text-lg font-semibold">{PRICE_FORMATTER.format(selectedPoint.revenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-lg font-semibold">{PRICE_FORMATTER.format(averageTicket)}</p>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-semibold">Estoque crítico</h3>
        {criticalStock.length === 0 ? (
          <EmptyListState
            title="Nenhum produto com estoque crítico"
            subtitle="Produtos com apenas 1 unidade disponível aparecem aqui."
          />
        ) : (
          <ul className="divide-y divide-border">
            {criticalStock.map((item) => (
              <li key={item.productId} className="flex items-center justify-between py-2 text-sm">
                <span>{item.productName ?? 'Produto removido'}</span>
                <span className="text-muted-foreground">{item.quantity} un.</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
