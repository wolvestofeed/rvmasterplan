import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { shared, colors, fonts } from '../styles'
import { PageHeader } from '../components/PageHeader'
import { MetricRow } from '../components/MetricRow'
import { SectionTitle } from '../components/SectionTitle'
import { PdfTable, TableColumn } from '../components/PdfTable'
import { formatCurrency, MONTH_NAMES } from '../utils'
import { PageFooter } from '../components/PageFooter'

const styles = StyleSheet.create({
  page: { ...shared.page },
  noticeBox: {
    marginHorizontal: 30,
    marginTop: 14,
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 10,
  },
  noticeText: {
    fontSize: fonts.sizeSm,
    color: colors.amber,
    fontFamily: 'Helvetica-Bold',
  },
  noDataText: {
    paddingHorizontal: 30,
    marginTop: 20,
    fontSize: fonts.sizeSm,
    color: colors.slateMid,
    fontFamily: 'Helvetica-Oblique',
  },
  stateSummarySection: {
    marginHorizontal: 30,
    marginTop: 6,
  },
  stateHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  stateHeaderCell: {
    fontSize: fonts.sizeXs,
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stateDataRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  stateDataRowAlt: { backgroundColor: colors.sage },
  stateCell: {
    fontSize: fonts.sizeSm,
    color: colors.slateText,
  },
})

export interface FuelEntry {
  id?: string
  name: string
  month: number
  year: number
  amount: number | string
  gallons?: number | string | null
  odometerReading?: number | string | null
  isHitched?: boolean | null
  stateLocation?: string | null
  createdAt?: string
}

interface FuelEconomyReportProps {
  fuelEntries: FuelEntry[]
  year?: number
}

export function FuelEconomyPages({ fuelEntries, year }: FuelEconomyReportProps) {
  const currentYear = year ?? new Date().getFullYear()

  // Sort by odometer ascending for MPG calculations
  const sorted = [...fuelEntries]
    .filter((e) => Number(e.odometerReading) > 0)
    .sort((a, b) => Number(a.odometerReading) - Number(b.odometerReading))

  // Calculate MPG between consecutive entries
  let totalDistance = 0
  let totalGallons = 0
  let totalSpent = 0
  const fillUpsWithMpg: Array<FuelEntry & { mpg: string; distance: string }> = []

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i]
    const currGal = Number(curr.gallons) || 0
    const currAmt = Number(curr.amount) || 0
    totalSpent += currAmt

    if (i === 0) {
      fillUpsWithMpg.push({ ...curr, mpg: '—', distance: '—' })
      continue
    }

    const prev = sorted[i - 1]
    const distance = Number(curr.odometerReading) - Number(prev.odometerReading)
    if (distance > 0 && currGal > 0) {
      const mpg = distance / currGal
      totalDistance += distance
      totalGallons += currGal
      fillUpsWithMpg.push({ ...curr, mpg: mpg.toFixed(1), distance: distance.toLocaleString() })
    } else {
      fillUpsWithMpg.push({ ...curr, mpg: '—', distance: '—' })
    }
  }

  const averageMPG = totalGallons > 0 ? totalDistance / totalGallons : 0
  const costPerMile = totalDistance > 0 ? totalSpent / totalDistance : 0
  const avgPricePerGallon = totalGallons > 0 ? totalSpent / totalGallons : 0

  const hasData = sorted.length >= 2
  const hasAnyEntries = fuelEntries.length > 0

  const metrics = [
    {
      label: 'Average MPG',
      value: averageMPG > 0 ? averageMPG.toFixed(1) : '—',
      subvalue: hasData ? `${totalDistance.toLocaleString()} mi tracked` : 'Need 2+ fill-ups',
      bgColor: colors.greenLight,
      valueColor: colors.green,
    },
    {
      label: 'Cost Per Mile',
      value: costPerMile > 0 ? `$${costPerMile.toFixed(3)}` : '—',
      bgColor: colors.redLight,
      valueColor: colors.red,
    },
    {
      label: 'Avg Price / Gallon',
      value: avgPricePerGallon > 0 ? `$${avgPricePerGallon.toFixed(3)}` : '—',
      bgColor: colors.amberLight,
      valueColor: colors.amber,
    },
    {
      label: 'Total Gallons Tracked',
      value: totalGallons > 0 ? `${totalGallons.toFixed(1)} gal` : '—',
      subvalue: `${fuelEntries.length} fill-ups`,
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
  ]

  // Fill-up log columns
  const logColumns: TableColumn[] = [
    { header: 'Month', key: 'period', flex: 1 },
    { header: 'State', key: 'state', flex: 0.7 },
    { header: 'Gallons', key: 'gallons', flex: 0.8, align: 'right' },
    { header: 'Odometer', key: 'odometer', flex: 1, align: 'right' },
    { header: 'Distance', key: 'distance', flex: 0.9, align: 'right' },
    { header: 'MPG', key: 'mpg', flex: 0.7, align: 'right', bold: true },
    { header: 'Cost', key: 'cost', flex: 0.9, align: 'right' },
    { header: 'Hitched', key: 'hitched', flex: 0.7, align: 'center' },
  ]

  // Show in reverse chronological order for the log display
  const logRows = [...fillUpsWithMpg].reverse().map((e) => ({
    period: `${MONTH_NAMES[e.month] ?? `Mo ${e.month}`} ${e.year}`,
    state: e.stateLocation || '—',
    gallons: Number(e.gallons || 0).toFixed(1),
    odometer: Number(e.odometerReading || 0).toLocaleString(),
    distance: e.distance,
    mpg: e.mpg,
    cost: formatCurrency(Number(e.amount || 0)),
    hitched: e.isHitched ? 'Yes' : 'No',
  }))

  // Monthly summary
  const monthMap: Record<string, { count: number; gallons: number; spent: number }> = {}
  fuelEntries.forEach((e) => {
    const key = `${e.year}-${String(e.month).padStart(2, '0')}`
    if (!monthMap[key]) monthMap[key] = { count: 0, gallons: 0, spent: 0 }
    monthMap[key].count++
    monthMap[key].gallons += Number(e.gallons || 0)
    monthMap[key].spent += Number(e.amount || 0)
  })

  const monthSummaryColumns: TableColumn[] = [
    { header: 'Month', key: 'period', flex: 1.5 },
    { header: '# Fill-ups', key: 'count', flex: 0.8, align: 'right' },
    { header: 'Gallons', key: 'gallons', flex: 0.9, align: 'right' },
    { header: 'Total Spent', key: 'spent', flex: 1, align: 'right', bold: true },
    { header: 'Avg $/Gal', key: 'avgPrice', flex: 1, align: 'right' },
  ]

  const monthSummaryRows = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, d]) => {
      const [yr, mo] = key.split('-')
      return {
        period: `${MONTH_NAMES[Number(mo)] ?? `Month ${mo}`} ${yr}`,
        count: String(d.count),
        gallons: d.gallons.toFixed(1),
        spent: formatCurrency(d.spent),
        avgPrice: d.gallons > 0 ? `$${(d.spent / d.gallons).toFixed(3)}` : '—',
      }
    })

  return (
    <>
      {/* Page 1: Metrics + Monthly Summary */}
      <Page size="A4" style={styles.page}>
        <PageHeader
          imagePath="/images/page-headers/rvmp-fuel-econ-header.jpg"
          badge="Department Report"
          title="Fuel Economy"
          subtitle={`MPG history, cost per mile & fuel tracking — ${currentYear}`}
        />

        <MetricRow metrics={metrics} />

        {!hasAnyEntries && (
          <Text style={styles.noDataText}>
            No fuel fill-ups recorded yet. Log your first fill-up in the Fuel Economy tracker to generate this report.
          </Text>
        )}

        {hasAnyEntries && !hasData && (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              MPG calculations require at least 2 consecutive fill-ups with odometer readings. Log more fill-ups to see your fuel economy stats.
            </Text>
          </View>
        )}

        {hasAnyEntries && (
          <>
            <SectionTitle title="Monthly Summary" />
            <PdfTable
              columns={monthSummaryColumns}
              rows={monthSummaryRows}
              emptyMessage="No monthly data available."
            />
          </>
        )}

        <PageFooter deptLabel="Fuel Economy" pageLabel="Page 1" />
      </Page>

      {/* Page 2: Fill-up Log */}
      {hasAnyEntries && (
        <Page size="A4" style={styles.page}>
          <View style={{ paddingTop: 28 }}>
            <SectionTitle title="Fill-up Log" />
            <PdfTable
              columns={logColumns}
              rows={logRows}
              emptyMessage="No fill-up entries recorded."
            />
          </View>
          <PageFooter deptLabel="Fuel Economy" pageLabel="Page 2" />
        </Page>
      )}
    </>
  )
}

export function FuelEconomyReport(props: FuelEconomyReportProps) {
  return (
    <Document>
      <FuelEconomyPages {...props} />
    </Document>
  )
}
