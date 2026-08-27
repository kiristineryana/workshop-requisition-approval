import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type {
    TableRow,
    ReadableTableRow,
    GeneratedComponentProps,
} from './RuntimeTypes';
import {
    makeStyles,
    tokens,
    Text,
    Spinner,
    Button,
    Badge,
    SearchBox,
    Dropdown,
    Option,
    DataGrid,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridBody,
    DataGridRow,
    DataGridCell,
    TableCellLayout,
    createTableColumn,
    type TableColumnDefinition,
} from '@fluentui/react-components';
import {
    ArrowClockwiseRegular,
    ClipboardTaskListLtrRegular,
    MoneyRegular,
    ClockRegular,
    CheckmarkCircleRegular,
    DismissCircleRegular,
    SearchRegular,
    FilterRegular,
    DataBarVerticalRegular,
    ChartMultipleRegular,
    ArrowTrendingRegular,
    ShieldErrorRegular,
    ShieldTaskRegular,
    WalletRegular,
} from '@fluentui/react-icons';

// ---------------------------------------------------------------------------
// Requisition Analytics — KPI overview of wksp_requisition records by status,
// value tier, and month, plus a quick, searchable/filterable/sortable view of
// what is currently pending approval (Submitted / In Approval).
// ---------------------------------------------------------------------------

// ---------- Raw row shape (verified against RuntimeTypes.ts) ----------

type RequisitionRow = TableRow<{
    readonly wksp_requisitionid: string;
    wksp_requisitionnumber: string;
    wksp_status: number;
    wksp_valuetier: number;
    wksp_totalvalue: number;
    wksp_datesubmitted: Date;
    wksp_riskscore: number;
    wksp_risklevel: number;
    readonly _wksp_requesterid_value: `/systemuser(${string})`;
    readonly _wksp_currentapproverid_value: `/systemuser(${string})`;
}>;

type ReadableRequisition = ReadableTableRow<RequisitionRow>;

// Normalized shape used throughout the UI after mapping the raw query result.
type RequisitionRecord = {
    id: string;
    number: string;
    status: number;
    valueTier: number;
    totalValue: number;
    dateSubmitted: Date | null;
    requesterName: string;
    approverName: string;
    riskScore: number;
    riskLevel: number;
};

// Raw row shape for the Cost Centre budget-vs-committed section.
type CostCentreRow = TableRow<{
    readonly wksp_costcentreid: string;
    wksp_name: string;
    wksp_monthlybudget: number;
    wksp_committedamount: number;
}>;

type ReadableCostCentre = ReadableTableRow<CostCentreRow>;

type CostCentreRecord = {
    id: string;
    name: string;
    monthlyBudget: number;
    committedAmount: number;
};

// ---------- Enum metadata (verified against RuntimeTypes.ts) ----------

type BadgeColor = 'subtle' | 'informative' | 'warning' | 'success' | 'danger' | 'brand';

// ---------- Brand palette (wireframe 1c — explicit hex, not tokens.colorPalette*) ----------

const BRAND_NAVY = '#181059';
const BRAND_RED = '#D42A41';
const GOLD = '#F5B128';
const GREEN = '#34C759';
const PERIWINKLE = '#7A81BE';
const SUBMITTED_BLUE = '#5B63A8';
const GREY_BLUE = '#B9BCD0';
const SURFACE_MUTED = '#F3F4F6';

const STATUS_META: { value: number; label: string; badgeColor: BadgeColor; chartColor: string }[] = [
    { value: 100000000, label: 'Draft', badgeColor: 'subtle', chartColor: GREY_BLUE },
    { value: 100000001, label: 'Submitted', badgeColor: 'informative', chartColor: SUBMITTED_BLUE },
    { value: 100000002, label: 'In Approval', badgeColor: 'warning', chartColor: GOLD },
    { value: 100000003, label: 'Approved', badgeColor: 'success', chartColor: BRAND_NAVY },
    { value: 100000004, label: 'Rejected', badgeColor: 'danger', chartColor: BRAND_RED },
    { value: 100000005, label: 'Ordered', badgeColor: 'brand', chartColor: PERIWINKLE },
    { value: 100000006, label: 'Received', badgeColor: 'success', chartColor: GREEN },
];

const VALUETIER_META: { value: number; label: string; chartColor: string; approver: string }[] = [
    { value: 100000000, label: 'Under 1,000 AED', chartColor: GREY_BLUE, approver: 'Supervisor' },
    { value: 100000001, label: '1,000-10,000 AED', chartColor: BRAND_NAVY, approver: 'Manager' },
    { value: 100000002, label: 'Above 10,000 AED', chartColor: BRAND_RED, approver: 'Mgr → Finance' },
];

const RISK_LEVEL_META: { value: number; label: string; chartColor: string }[] = [
    { value: 100000000, label: 'Low', chartColor: GREEN },
    { value: 100000001, label: 'Medium', chartColor: GOLD },
    { value: 100000002, label: 'High', chartColor: BRAND_RED },
];

const PENDING_STATUS_VALUES = [100000001, 100000002]; // Submitted, In Approval
const CLOSED_STATUS_VALUES = [100000004, 100000006]; // Rejected, Received — excluded from "open"

function getStatusMeta(value: number) {
    return STATUS_META.find((m) => m.value === value) ?? { value, label: 'Unknown', badgeColor: 'subtle' as BadgeColor, chartColor: tokens.colorNeutralForeground3 };
}

function getValueTierMeta(value: number) {
    return VALUETIER_META.find((m) => m.value === value) ?? { value, label: 'Unknown', chartColor: tokens.colorNeutralForeground3, approver: '—' };
}

function getRiskLevelMeta(value: number) {
    return RISK_LEVEL_META.find((m) => m.value === value) ?? { value, label: 'Unknown', chartColor: tokens.colorNeutralForeground3 };
}

// ---------- Helpers ----------

function getFormattedValue(row: ReadableRequisition, field: string): string {
    const raw = (row as unknown as Record<string, unknown>)[`${field}@OData.Community.Display.V1.FormattedValue`];
    return typeof raw === 'string' && raw.length > 0 ? raw : '—';
}

function parseDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' && value.length > 0) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function formatCurrency(value: number): string {
    return Number.isFinite(value) ? currencyFormatter.format(value) : '—';
}

function formatDate(value: Date | null): string {
    return value ? dateFormatter.format(value) : '—';
}

// ---------- Module-level cache + in-flight de-dupe (Rule 15) ----------

const CACHE_KEY = '__ppRequisitionAnalytics_requisitionCache';
const INFLIGHT_KEY = '__ppRequisitionAnalytics_requisitionInflight';
const COSTCENTRE_CACHE_KEY = '__ppRequisitionAnalytics_costCentreCache';
const COSTCENTRE_INFLIGHT_KEY = '__ppRequisitionAnalytics_costCentreInflight';
const winAny = window as unknown as Record<string, unknown>;

// ---------- Styles ----------

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalL,
        padding: tokens.spacingHorizontalXL,
        width: '100%',
        boxSizing: 'border-box',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
        contain: 'layout',
    },
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: tokens.spacingHorizontalM,
        flexWrap: 'wrap',
    },
    headerTextGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
    },
    spinnerWrap: {
        display: 'flex',
        justifyContent: 'center',
        padding: tokens.spacingVerticalXXL,
    },
    errorBanner: {
        padding: tokens.spacingHorizontalM,
        backgroundColor: tokens.colorStatusDangerBackground2,
        color: tokens.colorStatusDangerForeground2,
        borderRadius: tokens.borderRadiusMedium,
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: tokens.spacingHorizontalM,
        '@media (max-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
        '@media (max-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
    },
    kpiCard: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        padding: tokens.spacingHorizontalM,
        backgroundColor: SURFACE_MUTED,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusLarge,
        minWidth: 0,
    },
    kpiCardDanger: {
        backgroundColor: '#FFF4F5',
        border: `${tokens.strokeWidthThin} solid ${BRAND_RED}`,
    },
    kpiIconWrap: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: tokens.borderRadiusCircular,
        flexShrink: 0,
        fontSize: '20px',
    },
    kpiTextGroup: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
    },
    kpiValue: {
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightSemibold,
        fontFamily: tokens.fontFamilyBase,
        fontVariantNumeric: 'tabular-nums',
        color: BRAND_NAVY,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    kpiValueDanger: {
        color: BRAND_RED,
    },
    kpiLabel: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },
    kpiLabelDanger: {
        color: BRAND_RED,
    },
    chartsRow: {
        display: 'flex',
        gap: tokens.spacingHorizontalM,
        flexWrap: 'wrap',
        alignItems: 'stretch',
        '@media (max-width: 900px)': { flexDirection: 'column' },
    },
    chartCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        padding: tokens.spacingHorizontalL,
        backgroundColor: tokens.colorNeutralBackground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusLarge,
        boxSizing: 'border-box',
    },
    statusCard: {
        flex: '1 1 340px',
    },
    tierCard: {
        flex: '1 1 260px',
        alignItems: 'center',
    },
    trendCard: {
        flex: '1 1 100%',
    },
    chartTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        color: tokens.colorNeutralForeground1,
    },
    legend: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
    },
    legendRow: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
    },
    legendSwatch: {
        width: '10px',
        height: '10px',
        borderRadius: tokens.borderRadiusCircular,
        flexShrink: 0,
    },
    riskMixBar: {
        display: 'flex',
        width: '100%',
        height: '18px',
        borderRadius: '999px',
        overflow: 'hidden',
        backgroundColor: SURFACE_MUTED,
    },
    costCentreList: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
    },
    costCentreRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
    },
    costCentreTrack: {
        width: '100%',
        height: '10px',
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: SURFACE_MUTED,
        overflow: 'hidden',
    },
    costCentreFill: {
        height: '100%',
        borderRadius: tokens.borderRadiusMedium,
        transition: 'width 0.4s ease',
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacingHorizontalM,
        flexWrap: 'wrap',
    },
    sectionTitleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        color: tokens.colorNeutralForeground1,
    },
    sectionControls: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        flexWrap: 'wrap',
    },
    tableSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
    },
    tableCard: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusLarge,
        overflow: 'hidden',
        backgroundColor: tokens.colorNeutralBackground1,
    },
    tableHeaderRow: {
        backgroundColor: SURFACE_MUTED,
        textTransform: 'uppercase',
        fontSize: tokens.fontSizeBase200,
        letterSpacing: '0.03em',
    },
    riskPill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        padding: `2px ${tokens.spacingHorizontalS}`,
        borderRadius: '999px',
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        color: '#FFFFFF',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacingVerticalS,
        padding: tokens.spacingVerticalXXL,
        color: tokens.colorNeutralForeground3,
        textAlign: 'center',
    },
    subtitle: {
        color: tokens.colorNeutralForeground3,
    },
    searchBox: {
        minWidth: '220px',
        flex: '1 1 220px',
    },
    visuallyHidden: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
        border: 0,
    },
});

// ---------- KPI card ----------

function KpiCard(props: { icon: JSX.Element; label: string; value: string; accentBg: string; danger?: boolean }) {
    const styles = useStyles();
    return (
        <div className={props.danger ? `${styles.kpiCard} ${styles.kpiCardDanger}` : styles.kpiCard}>
            <div className={styles.kpiIconWrap} style={{ backgroundColor: props.accentBg }}>
                {props.icon}
            </div>
            <div className={styles.kpiTextGroup}>
                <Text className={props.danger ? `${styles.kpiValue} ${styles.kpiValueDanger}` : styles.kpiValue} title={props.value}>
                    {props.value}
                </Text>
                <Text className={props.danger ? `${styles.kpiLabel} ${styles.kpiLabelDanger}` : styles.kpiLabel}>{props.label}</Text>
            </div>
        </div>
    );
}

// ---------- Status horizontal bar chart (D3) ----------

const STATUS_CHART_WIDTH = 520;
const STATUS_BAR_HEIGHT = 24;
const STATUS_ROW_GAP = 12;
const STATUS_ANIM_KEY = '__ppReqAnalyticsStatusChartAnimated';

function StatusBarChart(props: { data: { label: string; count: number; color: string }[] }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { data } = props;

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const w = window as unknown as Record<string, boolean>;

        if (w[STATUS_ANIM_KEY] && svg.selectAll('rect.value-bar').size() > 0) return;
        const shouldAnimate = !w[STATUS_ANIM_KEY];
        w[STATUS_ANIM_KEY] = true;

        const margin = { top: 4, right: 40, bottom: 4, left: 96 };
        const rowHeight = STATUS_BAR_HEIGHT + STATUS_ROW_GAP;
        const height = Math.max(1, data.length) * rowHeight;
        const innerWidth = STATUS_CHART_WIDTH - margin.left - margin.right;

        svg.selectAll('*').remove();
        svg.attr('viewBox', `0 0 ${STATUS_CHART_WIDTH} ${height}`);

        const maxCount = Math.max(1, d3.max(data, (d) => d.count) ?? 1);
        const x = d3.scaleLinear().domain([0, maxCount]).range([0, innerWidth]);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const rows = g
            .selectAll('g.status-row')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'status-row')
            .attr('transform', (_d, i) => `translate(0, ${i * rowHeight})`);

        rows
            .append('text')
            .attr('x', -10)
            .attr('y', STATUS_BAR_HEIGHT / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .style('font-family', tokens.fontFamilyBase)
            .attr('fill', tokens.colorNeutralForeground1)
            .text((d) => d.label);

        rows
            .append('rect')
            .attr('class', 'track')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', innerWidth)
            .attr('height', STATUS_BAR_HEIGHT)
            .attr('rx', 4)
            .attr('fill', SURFACE_MUTED);

        const bars = rows
            .append('rect')
            .attr('class', 'value-bar')
            .attr('x', 0)
            .attr('y', 0)
            .attr('height', STATUS_BAR_HEIGHT)
            .attr('rx', 4)
            .attr('fill', (d) => d.color);

        if (shouldAnimate) {
            bars
                .attr('width', 0)
                .transition()
                .duration(600)
                .attr('width', (d) => x(d.count));
        } else {
            bars.attr('width', (d) => x(d.count));
        }

        rows
            .append('text')
            .attr('x', (d) => x(d.count) + 8)
            .attr('y', STATUS_BAR_HEIGHT / 2)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('font-family', tokens.fontFamilyBase)
            .style('font-variant-numeric', 'tabular-nums')
            .attr('fill', tokens.colorNeutralForeground2)
            .text((d) => String(d.count));
    }, [data]);

    return (
        <svg
            ref={svgRef}
            role="img"
            aria-label="Requisitions by status"
            style={{ width: '100%', height: 'auto', display: 'block' }}
        />
    );
}

// ---------- Spend-by-tier bar chart (D3) — wireframe 1c's 3-bar layout ----------

const TIER_BAR_WIDTH = 280;
const TIER_BAR_HEIGHT = 220;
const TIER_BAR_ANIM_KEY = '__ppReqAnalyticsTierBarChartAnimated';

type TierBarDatum = { label: string; value: number; color: string; approver: string };

function SpendByTierChart(props: { data: TierBarDatum[] }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { data } = props;

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const w = window as unknown as Record<string, boolean>;

        if (w[TIER_BAR_ANIM_KEY] && svg.selectAll('rect.tier-bar').size() > 0) return;
        const shouldAnimate = !w[TIER_BAR_ANIM_KEY];
        w[TIER_BAR_ANIM_KEY] = true;

        svg.selectAll('*').remove();

        const margin = { top: 28, right: 12, bottom: 34, left: 12 };
        const innerWidth = TIER_BAR_WIDTH - margin.left - margin.right;
        const innerHeight = TIER_BAR_HEIGHT - margin.top - margin.bottom;

        svg.attr('viewBox', `0 0 ${TIER_BAR_WIDTH} ${TIER_BAR_HEIGHT}`);
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3
            .scaleBand<string>()
            .domain(data.map((d) => d.label))
            .range([0, innerWidth])
            .padding(0.35);
        const maxValue = Math.max(1, d3.max(data, (d) => d.value) ?? 1);
        const y = d3.scaleLinear().domain([0, maxValue]).range([innerHeight, 0]).nice();

        const bars = g
            .selectAll('rect.tier-bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'tier-bar')
            .attr('x', (d) => x(d.label) ?? 0)
            .attr('width', x.bandwidth())
            .attr('rx', 3)
            .attr('fill', (d) => d.color);

        if (shouldAnimate) {
            bars
                .attr('y', innerHeight)
                .attr('height', 0)
                .transition()
                .duration(600)
                .attr('y', (d) => y(d.value))
                .attr('height', (d) => innerHeight - y(d.value));
        } else {
            bars.attr('y', (d) => y(d.value)).attr('height', (d) => innerHeight - y(d.value));
        }

        g.selectAll('text.tier-value')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'tier-value')
            .attr('x', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
            .attr('y', (d) => y(d.value) - 6)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', '600')
            .style('font-family', tokens.fontFamilyBase)
            .style('font-variant-numeric', 'tabular-nums')
            .attr('fill', tokens.colorNeutralForeground1)
            .text((d) => (d.value > 0 ? `AED ${Math.round(d.value).toLocaleString('en-US')}` : '—'));

        g.selectAll('text.tier-approver')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'tier-approver')
            .attr('x', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
            .attr('y', innerHeight + 16)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('font-family', tokens.fontFamilyBase)
            .attr('fill', tokens.colorNeutralForeground3)
            .text((d) => d.approver);
    }, [data]);

    return (
        <svg
            ref={svgRef}
            role="img"
            aria-label="Spend by value tier"
            style={{ width: '100%', height: 'auto', display: 'block' }}
        />
    );
}

// ---------- Monthly trend bar chart (D3) ----------

const TREND_WIDTH = 900;
const TREND_HEIGHT = 220;
const TREND_ANIM_KEY = '__ppReqAnalyticsTrendChartAnimated';

function MonthlyTrendChart(props: { data: { key: string; label: string; count: number }[] }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { data } = props;

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const w = window as unknown as Record<string, boolean>;

        if (w[TREND_ANIM_KEY] && svg.selectAll('rect.trend-bar').size() > 0) return;
        const shouldAnimate = !w[TREND_ANIM_KEY];
        w[TREND_ANIM_KEY] = true;

        svg.selectAll('*').remove();

        const margin = { top: 16, right: 16, bottom: 32, left: 40 };
        const innerWidth = TREND_WIDTH - margin.left - margin.right;
        const innerHeight = TREND_HEIGHT - margin.top - margin.bottom;

        svg.attr('viewBox', `0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`);
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const chartData = data.length > 0 ? data : [{ key: 'none', label: 'No data', count: 0 }];

        const x = d3
            .scaleBand<string>()
            .domain(chartData.map((d) => d.label))
            .range([0, innerWidth])
            .padding(0.35);
        const maxCount = Math.max(1, d3.max(chartData, (d) => d.count) ?? 1);
        const y = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]).nice();

        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .selectAll('text')
            .style('font-size', '11px')
            .style('font-family', tokens.fontFamilyBase)
            .attr('fill', tokens.colorNeutralForeground2);

        g.append('g')
            .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0).tickFormat(d3.format('d')))
            .selectAll('text')
            .style('font-size', '11px')
            .style('font-family', tokens.fontFamilyBase)
            .attr('fill', tokens.colorNeutralForeground2);

        g.selectAll('.domain, .tick line').attr('stroke', tokens.colorNeutralStroke2);

        const bars = g
            .selectAll('rect.trend-bar')
            .data(chartData)
            .enter()
            .append('rect')
            .attr('class', 'trend-bar')
            .attr('x', (d) => x(d.label) ?? 0)
            .attr('width', x.bandwidth())
            .attr('rx', 3)
            .attr('fill', BRAND_NAVY);

        if (shouldAnimate) {
            bars
                .attr('y', innerHeight)
                .attr('height', 0)
                .transition()
                .duration(600)
                .attr('y', (d) => y(d.count))
                .attr('height', (d) => innerHeight - y(d.count));
        } else {
            bars.attr('y', (d) => y(d.count)).attr('height', (d) => innerHeight - y(d.count));
        }
    }, [data]);

    return (
        <svg
            ref={svgRef}
            role="img"
            aria-label="Requisitions submitted by month"
            style={{ width: '100%', height: 'auto', display: 'block' }}
        />
    );
}

// ---------- Main component ----------

const GeneratedComponent = (props: GeneratedComponentProps) => {
    const { dataApi, pageInput } = props;
    void pageInput; // analytics page has no caller-supplied input; destructure per rules
    const styles = useStyles();

    const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
    const setContainer = (node: HTMLDivElement | null) => setContainerNode(node);

    const [data, setData] = useState<{ records: RequisitionRecord[]; loading: boolean; error: string | null }>(() => {
        const cached = winAny[CACHE_KEY] as RequisitionRecord[] | undefined;
        return { records: cached ?? [], loading: cached === undefined, error: null };
    });
    const [costCentreData, setCostCentreData] = useState<{ records: CostCentreRecord[]; loading: boolean; error: string | null }>(() => {
        const cached = winAny[COSTCENTRE_CACHE_KEY] as CostCentreRecord[] | undefined;
        return { records: cached ?? [], loading: cached === undefined, error: null };
    });
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState<string>('all');
    const [reloadKey, setReloadKey] = useState(0);

    const dataReady = !!dataApi;

    useEffect(() => {
        if (!dataReady) return;

        const cached = winAny[CACHE_KEY] as RequisitionRecord[] | undefined;
        if (cached !== undefined) {
            if (data.records !== cached) setData({ records: cached, loading: false, error: null });
            return;
        }
        let cancelled = false;

        let inflight = winAny[INFLIGHT_KEY] as Promise<RequisitionRecord[]> | undefined;
        if (!inflight) {
            inflight = dataApi
                .queryTable('wksp_requisition', {
                    select: [
                        'wksp_requisitionid',
                        'wksp_requisitionnumber',
                        'wksp_status',
                        'wksp_valuetier',
                        'wksp_totalvalue',
                        'wksp_datesubmitted',
                        'wksp_riskscore',
                        'wksp_risklevel',
                        '_wksp_requesterid_value',
                        '_wksp_currentapproverid_value',
                    ],
                    pageSize: 500,
                })
                .then((result) => {
                    const mapped: RequisitionRecord[] = (result.rows as unknown as ReadableRequisition[]).map((row) => ({
                        id: row.wksp_requisitionid,
                        number: row.wksp_requisitionnumber ?? '—',
                        status: row.wksp_status as unknown as number,
                        valueTier: row.wksp_valuetier as unknown as number,
                        totalValue: typeof row.wksp_totalvalue === 'number' ? row.wksp_totalvalue : 0,
                        dateSubmitted: parseDate(row.wksp_datesubmitted),
                        requesterName: getFormattedValue(row, '_wksp_requesterid_value'),
                        approverName: getFormattedValue(row, '_wksp_currentapproverid_value'),
                        riskScore: typeof row.wksp_riskscore === 'number' ? row.wksp_riskscore : 0,
                        riskLevel: row.wksp_risklevel as unknown as number,
                    }));
                    winAny[CACHE_KEY] = mapped;
                    return mapped;
                })
                .finally(() => {
                    if (winAny[INFLIGHT_KEY] === inflight) delete winAny[INFLIGHT_KEY];
                });
            winAny[INFLIGHT_KEY] = inflight;
        }

        inflight
            .then((rows) => {
                if (!cancelled) setData({ records: rows, loading: false, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : 'Unable to load requisitions.';
                setData({ records: [], loading: false, error: message });
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataReady, reloadKey]);

    useEffect(() => {
        if (!dataReady) return;

        const cached = winAny[COSTCENTRE_CACHE_KEY] as CostCentreRecord[] | undefined;
        if (cached !== undefined) {
            if (costCentreData.records !== cached) setCostCentreData({ records: cached, loading: false, error: null });
            return;
        }
        let cancelled = false;

        let inflight = winAny[COSTCENTRE_INFLIGHT_KEY] as Promise<CostCentreRecord[]> | undefined;
        if (!inflight) {
            inflight = dataApi
                .queryTable('wksp_costcentre', {
                    select: ['wksp_costcentreid', 'wksp_name', 'wksp_monthlybudget', 'wksp_committedamount'],
                    pageSize: 500,
                })
                .then((result) => {
                    const mapped: CostCentreRecord[] = (result.rows as unknown as ReadableCostCentre[]).map((row) => ({
                        id: row.wksp_costcentreid,
                        name: row.wksp_name ?? '—',
                        monthlyBudget: typeof row.wksp_monthlybudget === 'number' ? row.wksp_monthlybudget : 0,
                        committedAmount: typeof row.wksp_committedamount === 'number' ? row.wksp_committedamount : 0,
                    }));
                    winAny[COSTCENTRE_CACHE_KEY] = mapped;
                    return mapped;
                })
                .finally(() => {
                    if (winAny[COSTCENTRE_INFLIGHT_KEY] === inflight) delete winAny[COSTCENTRE_INFLIGHT_KEY];
                });
            winAny[COSTCENTRE_INFLIGHT_KEY] = inflight;
        }

        inflight
            .then((rows) => {
                if (!cancelled) setCostCentreData({ records: rows, loading: false, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : 'Unable to load cost centres.';
                setCostCentreData({ records: [], loading: false, error: message });
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataReady, reloadKey]);

    const openRecords = useMemo(
        () => data.records.filter((r) => !CLOSED_STATUS_VALUES.includes(r.status)),
        [data.records],
    );

    const kpis = useMemo(() => {
        const records = data.records;
        const total = records.length;
        const totalValue = records.reduce((sum, r) => sum + (Number.isFinite(r.totalValue) ? r.totalValue : 0), 0);
        const pending = records.filter((r) => PENDING_STATUS_VALUES.includes(r.status)).length;
        const approved = records.filter((r) => r.status === 100000003).length;
        const rejected = records.filter((r) => r.status === 100000004).length;
        const highRiskOpen = openRecords.filter((r) => r.riskLevel === 100000002);
        const highRiskCount = highRiskOpen.length;
        const highRiskExposure = highRiskOpen.reduce((sum, r) => sum + (Number.isFinite(r.totalValue) ? r.totalValue : 0), 0);
        return { total, totalValue, pending, approved, rejected, highRiskCount, highRiskExposure };
    }, [data.records, openRecords]);

    const statusDistribution = useMemo(
        () =>
            STATUS_META.map((meta) => ({
                label: meta.label,
                count: data.records.filter((r) => r.status === meta.value).length,
                color: meta.chartColor,
            })),
        [data.records],
    );

    const tierDistribution = useMemo(
        () =>
            VALUETIER_META.map((meta) => ({
                label: meta.label,
                value: data.records
                    .filter((r) => r.valueTier === meta.value)
                    .reduce((sum, r) => sum + (Number.isFinite(r.totalValue) ? r.totalValue : 0), 0),
                color: meta.chartColor,
                approver: meta.approver,
            })),
        [data.records],
    );

    const riskMix = useMemo(
        () =>
            RISK_LEVEL_META.map((meta) => ({
                label: meta.label,
                count: openRecords.filter((r) => r.riskLevel === meta.value).length,
                color: meta.chartColor,
            })),
        [openRecords],
    );

    const riskMixTotal = riskMix.reduce((sum, r) => sum + r.count, 0);

    const sortedCostCentres = useMemo(
        () =>
            [...costCentreData.records].sort((a, b) => {
                const pctA = a.monthlyBudget > 0 ? a.committedAmount / a.monthlyBudget : -1;
                const pctB = b.monthlyBudget > 0 ? b.committedAmount / b.monthlyBudget : -1;
                return pctB - pctA;
            }),
        [costCentreData.records],
    );

    const monthlyTrend = useMemo(() => {
        const map = new Map<string, number>();
        data.records.forEach((r) => {
            if (!r.dateSubmitted) return;
            const key = `${r.dateSubmitted.getFullYear()}-${String(r.dateSubmitted.getMonth() + 1).padStart(2, '0')}`;
            map.set(key, (map.get(key) ?? 0) + 1);
        });
        const sortedKeys = Array.from(map.keys()).sort();
        const recentKeys = sortedKeys.slice(-6);
        return recentKeys.map((key) => {
            const [year, month] = key.split('-').map(Number);
            const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            return { key, label, count: map.get(key) ?? 0 };
        });
    }, [data.records]);

    const pendingRecords = useMemo(
        () => data.records.filter((r) => PENDING_STATUS_VALUES.includes(r.status)),
        [data.records],
    );

    const filteredPending = useMemo(() => {
        let rows = pendingRecords;
        if (tierFilter !== 'all') {
            const tierValue = Number(tierFilter);
            rows = rows.filter((r) => r.valueTier === tierValue);
        }
        const term = search.trim().toLowerCase();
        if (term) {
            rows = rows.filter(
                (r) =>
                    r.number.toLowerCase().includes(term) ||
                    r.requesterName.toLowerCase().includes(term) ||
                    r.approverName.toLowerCase().includes(term),
            );
        }
        return rows;
    }, [pendingRecords, search, tierFilter]);

    const columns: TableColumnDefinition<RequisitionRecord>[] = useMemo(
        () => [
            createTableColumn<RequisitionRecord>({
                columnId: 'number',
                compare: (a, b) => a.number.localeCompare(b.number),
                renderHeaderCell: () => 'Requisition #',
                renderCell: (item) => (
                    <TableCellLayout style={{ overflow: 'hidden', minWidth: 0 }}>
                        <span title={item.number} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.number}
                        </span>
                    </TableCellLayout>
                ),
            }),
            createTableColumn<RequisitionRecord>({
                columnId: 'requester',
                compare: (a, b) => a.requesterName.localeCompare(b.requesterName),
                renderHeaderCell: () => 'Requester',
                renderCell: (item) => (
                    <TableCellLayout style={{ overflow: 'hidden', minWidth: 0 }}>
                        <span title={item.requesterName} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.requesterName}
                        </span>
                    </TableCellLayout>
                ),
            }),
            createTableColumn<RequisitionRecord>({
                columnId: 'approver',
                compare: (a, b) => a.approverName.localeCompare(b.approverName),
                renderHeaderCell: () => 'Current approver',
                renderCell: (item) => (
                    <TableCellLayout style={{ overflow: 'hidden', minWidth: 0 }}>
                        <span title={item.approverName} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.approverName}
                        </span>
                    </TableCellLayout>
                ),
            }),
            createTableColumn<RequisitionRecord>({
                columnId: 'valueTier',
                compare: (a, b) => a.valueTier - b.valueTier,
                renderHeaderCell: () => 'Value tier',
                renderCell: (item) => <TableCellLayout>{getValueTierMeta(item.valueTier).label}</TableCellLayout>,
            }),
            createTableColumn<RequisitionRecord>({
                columnId: 'totalValue',
                compare: (a, b) => a.totalValue - b.totalValue,
                renderHeaderCell: () => 'Total value',
                renderCell: (item) => <TableCellLayout>{formatCurrency(item.totalValue)}</TableCellLayout>,
            }),
            createTableColumn<RequisitionRecord>({
                columnId: 'dateSubmitted',
                compare: (a, b) => (a.dateSubmitted?.getTime() ?? 0) - (b.dateSubmitted?.getTime() ?? 0),
                renderHeaderCell: () => 'Date submitted',
                renderCell: (item) => <TableCellLayout>{formatDate(item.dateSubmitted)}</TableCellLayout>,
            }),
            createTableColumn<RequisitionRecord>({
                columnId: 'status',
                compare: (a, b) => a.status - b.status,
                renderHeaderCell: () => 'Status',
                renderCell: (item) => {
                    const meta = getStatusMeta(item.status);
                    return (
                        <TableCellLayout>
                            <Badge color={meta.badgeColor} appearance="filled">
                                {meta.label}
                            </Badge>
                        </TableCellLayout>
                    );
                },
            }),
            createTableColumn<RequisitionRecord>({
                columnId: 'risk',
                compare: (a, b) => a.riskScore - b.riskScore,
                renderHeaderCell: () => 'Risk',
                renderCell: (item) => {
                    const meta = getRiskLevelMeta(item.riskLevel);
                    return (
                        <TableCellLayout>
                            <span
                                className={styles.riskPill}
                                style={{ backgroundColor: meta.chartColor, color: meta.value === 100000001 ? BRAND_NAVY : '#FFFFFF' }}
                                title={meta.label}
                            >
                                {item.riskScore}
                            </span>
                        </TableCellLayout>
                    );
                },
            }),
        ],
        [styles.riskPill],
    );

    const handleRefresh = () => {
        delete winAny[CACHE_KEY];
        delete winAny[INFLIGHT_KEY];
        delete winAny[COSTCENTRE_CACHE_KEY];
        delete winAny[COSTCENTRE_INFLIGHT_KEY];
        setData((prev) => ({ ...prev, loading: true, error: null }));
        setCostCentreData((prev) => ({ ...prev, loading: true, error: null }));
        setReloadKey((k) => k + 1);
    };

    const isLoading = data.loading || costCentreData.loading;
    const combinedError = data.error ?? costCentreData.error;

    if (isLoading) {
        return (
            <div className={styles.root} ref={setContainer}>
                <div className={styles.spinnerWrap}>
                    <Spinner labelPosition="below" label="Loading requisition analytics…" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.root} ref={setContainer}>
            <header className={styles.header}>
                <div className={styles.headerTextGroup}>
                    <Text as="h1" size={700} weight="bold" style={{ color: BRAND_NAVY }}>
                        Requisition analytics
                    </Text>
                    <Text size={300} className={styles.subtitle}>
                        KPI overview of workshop purchase requisitions by status, value tier, cost-centre budget, and risk mix, with a quick view of what is pending approval.
                    </Text>
                </div>
                <Button
                    appearance="secondary"
                    icon={<ArrowClockwiseRegular />}
                    onClick={handleRefresh}
                    aria-label="Refresh requisition data"
                >
                    Refresh
                </Button>
            </header>

            {combinedError && (
                <div role="alert" className={styles.errorBanner}>
                    {combinedError}
                </div>
            )}

            <section aria-labelledby="kpi-heading">
                <Text id="kpi-heading" className={styles.visuallyHidden}>
                    Key performance indicators
                </Text>
                <div className={styles.kpiGrid}>
                    <KpiCard
                        icon={<ClipboardTaskListLtrRegular style={{ color: tokens.colorBrandForeground2 }} />}
                        label="Total requisitions"
                        value={String(kpis.total)}
                        accentBg={tokens.colorBrandBackground2}
                    />
                    <KpiCard
                        icon={<MoneyRegular style={{ color: tokens.colorPaletteTealForeground2 }} />}
                        label="Total value"
                        value={formatCurrency(kpis.totalValue)}
                        accentBg={tokens.colorPaletteTealBackground2}
                    />
                    <KpiCard
                        icon={<ClockRegular style={{ color: tokens.colorPaletteMarigoldForeground2 }} />}
                        label="Pending approval"
                        value={String(kpis.pending)}
                        accentBg={tokens.colorPaletteMarigoldBackground2}
                    />
                    <KpiCard
                        icon={<CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground2 }} />}
                        label="Approved"
                        value={String(kpis.approved)}
                        accentBg={tokens.colorPaletteGreenBackground2}
                    />
                    <KpiCard
                        icon={<DismissCircleRegular style={{ color: tokens.colorPaletteRedForeground2 }} />}
                        label="Rejected"
                        value={String(kpis.rejected)}
                        accentBg={tokens.colorPaletteRedBackground2}
                    />
                    <KpiCard
                        icon={<ShieldErrorRegular style={{ color: BRAND_RED }} />}
                        label="High-risk open"
                        value={String(kpis.highRiskCount)}
                        accentBg="#FFE1E5"
                        danger
                    />
                </div>
                {kpis.highRiskCount > 0 && (
                    <Text size={200} className={styles.subtitle}>
                        {formatCurrency(kpis.highRiskExposure)} exposure across {kpis.highRiskCount} high-risk open requisition{kpis.highRiskCount === 1 ? '' : 's'}.
                    </Text>
                )}
            </section>

            <div className={styles.chartsRow}>
                <section className={`${styles.chartCard} ${styles.statusCard}`} aria-labelledby="status-chart-heading">
                    <div className={styles.chartTitleRow}>
                        <DataBarVerticalRegular />
                        <Text id="status-chart-heading" weight="semibold">
                            Requisitions by status
                        </Text>
                    </div>
                    {kpis.total === 0 ? (
                        <div className={styles.emptyState}>
                            <Text>No requisitions found.</Text>
                        </div>
                    ) : (
                        <StatusBarChart data={statusDistribution} />
                    )}
                </section>

                <section className={`${styles.chartCard} ${styles.tierCard}`} aria-labelledby="tier-chart-heading">
                    <div className={styles.chartTitleRow}>
                        <ChartMultipleRegular />
                        <Text id="tier-chart-heading" weight="semibold">
                            Spend by value tier
                        </Text>
                    </div>
                    {kpis.total === 0 ? (
                        <div className={styles.emptyState}>
                            <Text>No requisitions found.</Text>
                        </div>
                    ) : (
                        <SpendByTierChart data={tierDistribution} />
                    )}
                </section>
            </div>

            <div className={styles.chartsRow}>
                <section className={styles.chartCard} aria-labelledby="risk-mix-heading" style={{ flex: '1 1 340px' }}>
                    <div className={styles.chartTitleRow}>
                        <ShieldTaskRegular />
                        <Text id="risk-mix-heading" weight="semibold">
                            Risk mix
                        </Text>
                    </div>
                    <Text size={200} className={styles.subtitle}>
                        Includes open requisitions only (excludes Rejected and Received).
                    </Text>
                    {riskMixTotal === 0 ? (
                        <div className={styles.emptyState}>
                            <Text>No open requisitions to score.</Text>
                        </div>
                    ) : (
                        <>
                            <div
                                className={styles.riskMixBar}
                                role="img"
                                aria-label={`Risk mix: ${riskMix.map((r) => `${r.count} ${r.label.toLowerCase()}`).join(', ')}`}
                            >
                                {riskMix.map((r) => (
                                    <span
                                        key={r.label}
                                        style={{
                                            backgroundColor: r.color,
                                            flexGrow: r.count > 0 ? r.count : 0,
                                            flexBasis: 0,
                                            minWidth: r.count > 0 ? '4px' : 0,
                                        }}
                                    />
                                ))}
                            </div>
                            <div className={styles.legend}>
                                {riskMix.map((r) => (
                                    <div className={styles.legendRow} key={r.label}>
                                        <span className={styles.legendSwatch} style={{ backgroundColor: r.color }} />
                                        <Text size={200}>
                                            {r.label} ({r.count})
                                        </Text>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                <section className={styles.chartCard} aria-labelledby="budget-heading" style={{ flex: '1 1 340px' }}>
                    <div className={styles.chartTitleRow}>
                        <WalletRegular />
                        <Text id="budget-heading" weight="semibold">
                            Cost centre budget
                        </Text>
                    </div>
                    {sortedCostCentres.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Text>No cost centres found.</Text>
                        </div>
                    ) : (
                        <div className={styles.costCentreList}>
                            {sortedCostCentres.map((c) => {
                                const hasBudget = c.monthlyBudget > 0;
                                const pct = hasBudget ? Math.round((c.committedAmount / c.monthlyBudget) * 100) : null;
                                const fillColor = pct === null ? tokens.colorNeutralForeground3 : pct > 100 ? BRAND_RED : pct >= 90 ? GOLD : BRAND_NAVY;
                                const fillWidth = pct === null ? '0%' : `${Math.min(100, pct)}%`;
                                return (
                                    <div className={styles.costCentreRow} key={c.id}>
                                        <div className={styles.sectionHeader}>
                                            <Text size={300} weight="semibold">
                                                {c.name}
                                            </Text>
                                            <Text size={200} className={styles.subtitle}>
                                                {hasBudget
                                                    ? `${formatCurrency(c.committedAmount)} of ${formatCurrency(c.monthlyBudget)} · ${pct}% committed`
                                                    : 'No budget set'}
                                            </Text>
                                        </div>
                                        <div
                                            className={styles.costCentreTrack}
                                            role="img"
                                            aria-label={
                                                hasBudget
                                                    ? `${c.name}: ${pct}% of budget committed`
                                                    : `${c.name}: no budget set`
                                            }
                                        >
                                            <div className={styles.costCentreFill} style={{ width: fillWidth, backgroundColor: fillColor }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <section className={`${styles.chartCard} ${styles.trendCard}`} aria-labelledby="trend-chart-heading">
                <div className={styles.chartTitleRow}>
                    <ArrowTrendingRegular />
                    <Text id="trend-chart-heading" weight="semibold">
                        Requisitions submitted by month
                    </Text>
                </div>
                {monthlyTrend.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Text>No submission dates recorded yet.</Text>
                    </div>
                ) : (
                    <MonthlyTrendChart data={monthlyTrend} />
                )}
            </section>

            <section className={styles.tableSection} aria-labelledby="pending-heading">
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitleGroup}>
                        <ClockRegular style={{ color: BRAND_NAVY }} />
                        <Text id="pending-heading" size={500} weight="bold" style={{ color: BRAND_NAVY }}>
                            Pending approval ({filteredPending.length})
                        </Text>
                    </div>
                    <div className={styles.sectionControls}>
                        <SearchBox
                            placeholder="Search by requisition #, requester, approver"
                            value={search}
                            onChange={(_, d) => setSearch(d.value ?? '')}
                            contentBefore={<SearchRegular />}
                            aria-label="Search pending requisitions"
                            className={styles.searchBox}
                        />
                        <Dropdown
                            aria-label="Filter by value tier"
                            placeholder="Value tier"
                            value={tierFilter === 'all' ? 'All value tiers' : getValueTierMeta(Number(tierFilter)).label}
                            selectedOptions={[tierFilter]}
                            onOptionSelect={(_, d) => setTierFilter(d.optionValue ?? 'all')}
                            mountNode={containerNode}
                        >
                            <Option value="all" text="All value tiers">
                                All value tiers
                            </Option>
                            {VALUETIER_META.map((t) => (
                                <Option key={t.value} value={String(t.value)} text={t.label}>
                                    {t.label}
                                </Option>
                            ))}
                        </Dropdown>
                    </div>
                </div>

                {filteredPending.length === 0 ? (
                    <div className={`${styles.emptyState} ${styles.tableCard}`}>
                        <FilterRegular fontSize={24} />
                        <Text>No pending requisitions match the current search or filter.</Text>
                    </div>
                ) : (
                    <div className={styles.tableCard}>
                    <DataGrid
                        items={filteredPending}
                        columns={columns}
                        getRowId={(row) => row.id}
                        sortable
                        resizableColumns
                        columnSizingOptions={{
                            number: { idealWidth: 140, minWidth: 110 },
                            requester: { idealWidth: 180, minWidth: 140 },
                            approver: { idealWidth: 180, minWidth: 140 },
                            valueTier: { idealWidth: 160, minWidth: 130 },
                            totalValue: { idealWidth: 130, minWidth: 110 },
                            dateSubmitted: { idealWidth: 140, minWidth: 120 },
                            status: { idealWidth: 130, minWidth: 110 },
                            risk: { idealWidth: 90, minWidth: 80 },
                        }}
                        aria-label="Pending approval requisitions"
                    >
                        <DataGridHeader className={styles.tableHeaderRow}>
                            <DataGridRow>
                                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
                            </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<RequisitionRecord>>
                            {({ item, rowId }) => (
                                <DataGridRow<RequisitionRecord> key={rowId}>
                                    {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                                </DataGridRow>
                            )}
                        </DataGridBody>
                    </DataGrid>
                    </div>
                )}
            </section>
        </div>
    );
};

export default GeneratedComponent;

