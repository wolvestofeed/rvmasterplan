import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { shared, colors, fonts } from '../styles'
import { PageHeader } from '../components/PageHeader'
import { MetricRow } from '../components/MetricRow'
import { SectionTitle } from '../components/SectionTitle'
import { PdfTable, TableColumn } from '../components/PdfTable'
import { PageFooter } from '../components/PageFooter'

const styles = StyleSheet.create({
  page: { ...shared.page },
  tankGrid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 30,
    marginTop: 10,
    marginBottom: 4,
  },
  tankCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  tankLabel: {
    fontSize: fonts.sizeXs,
    color: colors.slateMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tankValue: {
    fontSize: fonts.sizeLg,
    fontFamily: 'Helvetica-Bold',
    color: colors.slateText,
  },
  tankSub: {
    fontSize: fonts.sizeXs,
    color: colors.slateMid,
    marginTop: 2,
  },
  barTrack: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: 6,
  },
  barFill: {
    height: 5,
    borderRadius: 3,
  },
  noDataText: {
    paddingHorizontal: 30,
    marginTop: 20,
    fontSize: fonts.sizeSm,
    color: colors.slateMid,
    fontFamily: 'Helvetica-Oblique',
  },
})

export interface WaterSystem {
  freshWaterCapacity: number
  grayWaterCapacity: number
  blackWaterCapacity: number
}

export interface WaterActivity {
  id?: string
  name: string
  category: string
  gallonsPerUse: number | string
  timesPerDay: number | string
}

export interface TankLog {
  id?: string
  date: string
  type: 'Dump' | 'Fill'
  tank: 'Fresh' | 'Gray' | 'Black'
  volume: number | string
}

interface WaterReportProps {
  waterSystem: WaterSystem
  activities: WaterActivity[]
  tankLogs: TankLog[]
}

export function WaterPages({ waterSystem, activities, tankLogs }: WaterReportProps) {
  const totalDailyUsage = activities.reduce((s, a) => {
    return s + Number(a.gallonsPerUse) * Number(a.timesPerDay)
  }, 0)

  const freshDays = totalDailyUsage > 0 ? waterSystem.freshWaterCapacity / totalDailyUsage : 0
  const grayDays = totalDailyUsage > 0 ? waterSystem.grayWaterCapacity / totalDailyUsage : 0

  // Capacity bar percentages (relative to largest tank)
  const maxCap = Math.max(waterSystem.freshWaterCapacity, waterSystem.grayWaterCapacity, waterSystem.blackWaterCapacity)

  const metrics = [
    {
      label: 'Daily Water Usage',
      value: `${totalDailyUsage.toFixed(1)} gal/day`,
      subvalue: `${activities.length} activities`,
      bgColor: colors.cyanLight,
      valueColor: colors.cyan,
    },
    {
      label: 'Fresh Tank Capacity',
      value: `${waterSystem.freshWaterCapacity} gal`,
      subvalue: freshDays > 0 ? `~${freshDays.toFixed(1)} days` : undefined,
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
    {
      label: 'Gray Tank Capacity',
      value: `${waterSystem.grayWaterCapacity} gal`,
      subvalue: grayDays > 0 ? `~${grayDays.toFixed(1)} days` : undefined,
      bgColor: colors.sage,
    },
    {
      label: 'Black Tank Capacity',
      value: `${waterSystem.blackWaterCapacity} gal`,
      bgColor: colors.amberLight,
      valueColor: colors.amber,
    },
  ]

  // Activity table
  const activityColumns: TableColumn[] = [
    { header: 'Activity', key: 'name', flex: 2 },
    { header: 'Category', key: 'category', flex: 1.2 },
    { header: 'Gal / Use', key: 'gal', flex: 0.9, align: 'right' },
    { header: 'Times / Day', key: 'times', flex: 0.9, align: 'right' },
    { header: 'Gal / Day', key: 'daily', flex: 0.9, align: 'right', bold: true },
  ]

  const activityRows = activities.map((a) => {
    const daily = Number(a.gallonsPerUse) * Number(a.timesPerDay)
    return {
      name: a.name,
      category: a.category,
      gal: Number(a.gallonsPerUse).toFixed(1),
      times: Number(a.timesPerDay).toFixed(1),
      daily: daily.toFixed(1),
    }
  }).sort((a, b) => Number(b.daily) - Number(a.daily))

  // Tank log table
  const logColumns: TableColumn[] = [
    { header: 'Date', key: 'date', flex: 1.2 },
    { header: 'Type', key: 'type', flex: 0.7 },
    { header: 'Tank', key: 'tank', flex: 0.8 },
    { header: 'Volume (gal)', key: 'volume', flex: 1, align: 'right', bold: true },
  ]

  const logRows = [...tankLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((l) => ({
      date: l.date,
      type: l.type,
      tank: l.tank,
      volume: Number(l.volume).toFixed(1),
    }))

  // Tank log summary by tank/type
  const fillsByTank: Record<string, number> = {}
  const dumpsByTank: Record<string, number> = {}
  tankLogs.forEach((l) => {
    const vol = Number(l.volume)
    if (l.type === 'Fill') fillsByTank[l.tank] = (fillsByTank[l.tank] ?? 0) + vol
    else dumpsByTank[l.tank] = (dumpsByTank[l.tank] ?? 0) + vol
  })

  return (
    <>
      {/* Page 1: Metrics + Tank capacities + Activities */}
      <Page size="A4" style={styles.page}>
        <PageHeader
          imagePath="/images/page-headers/water-header.jpg"
          badge="Department Report"
          title="Water Management"
          subtitle="Tank capacities, daily usage & activity breakdown"
        />

        <MetricRow metrics={metrics} />

        <SectionTitle title="Tank Capacity Overview" />
        <View style={styles.tankGrid}>
          {[
            { label: 'Fresh Water', cap: waterSystem.freshWaterCapacity, color: colors.primary },
            { label: 'Gray Water', cap: waterSystem.grayWaterCapacity, color: colors.slateMid },
            { label: 'Black Water', cap: waterSystem.blackWaterCapacity, color: colors.amber },
          ].map((t) => (
            <View key={t.label} style={[styles.tankCard, { backgroundColor: colors.sage }]}>
              <Text style={styles.tankLabel}>{t.label}</Text>
              <Text style={styles.tankValue}>{t.cap} gal</Text>
              {totalDailyUsage > 0 && (
                <Text style={styles.tankSub}>
                  ~{(t.cap / totalDailyUsage).toFixed(1)} days at current usage
                </Text>
              )}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {
                  width: `${Math.round((t.cap / maxCap) * 100)}%`,
                  backgroundColor: t.color,
                }]} />
              </View>
            </View>
          ))}
        </View>

        <SectionTitle title="Daily Water Usage by Activity" />
        <PdfTable
          columns={activityColumns}
          rows={activityRows}
          emptyMessage="No water activities recorded."
        />

        <PageFooter deptLabel="Water Management" pageLabel="Page 1" />
      </Page>

      {/* Page 2: Tank Log */}
      <Page size="A4" style={styles.page}>
        <View style={{ paddingTop: 28 }}>
          <SectionTitle title="Tank Fill & Dump Log" />
          <PdfTable
            columns={logColumns}
            rows={logRows}
            emptyMessage="No tank log entries recorded."
          />
        </View>
        <PageFooter deptLabel="Water Management" pageLabel="Page 2" />
      </Page>
    </>
  )
}

export function WaterReport(props: WaterReportProps) {
  return (
    <Document>
      <WaterPages {...props} />
    </Document>
  )
}
