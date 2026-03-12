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
  footer: { ...shared.footer },
  footerText: { ...shared.footerText },
  equipmentBlock: {
    marginHorizontal: 30,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  equipmentHeader: {
    backgroundColor: colors.amber,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  equipmentHeaderText: {
    color: colors.white,
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  equipmentRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  equipmentRowAlt: { backgroundColor: colors.amberLight },
  equipmentCell: {
    fontSize: fonts.sizeSm,
    color: colors.slateText,
  },
  summaryBar: {
    marginHorizontal: 30,
    marginTop: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryBarItem: {
    alignItems: 'center',
  },
  summaryBarValue: {
    fontSize: fonts.sizeLg,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDark,
  },
  summaryBarLabel: {
    fontSize: fonts.sizeXs,
    color: colors.slateMid,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
})

export interface ElectricalDevice {
  id?: string
  name: string
  group: string
  category?: string
  watts: number
  hoursPerDay: number
}

export interface SolarEquipmentItem {
  id?: string
  make?: string
  model?: string
  equipmentType: string
  wattage?: number
  quantity?: number
  weight?: number
  specs?: Record<string, unknown>
}

interface PowerSolarReportProps {
  devices: ElectricalDevice[]
  solarEquipment: SolarEquipmentItem[]
}

export function PowerSolarPages({ devices, solarEquipment }: PowerSolarReportProps) {
  const totalDailyWh = devices.reduce((sum, d) => sum + (d.watts * d.hoursPerDay), 0)
  const essentialWh = devices
    .filter((d) => d.group === 'Essential')
    .reduce((sum, d) => sum + (d.watts * d.hoursPerDay), 0)

  const panels = solarEquipment.filter((e) => e.equipmentType === 'Solar Panel' || e.equipmentType === 'Panel')
  const batteries = solarEquipment.filter((e) => e.equipmentType === 'Battery')
  const generators = solarEquipment.filter((e) => e.equipmentType === 'Generator')
  const other = solarEquipment.filter(
    (e) => !['Solar Panel', 'Panel', 'Battery', 'Generator'].includes(e.equipmentType)
  )

  const totalPanelW = panels.reduce((s, p) => s + ((p.wattage ?? 0) * (p.quantity ?? 1)), 0)
  const estDailyGeneration = Math.round(totalPanelW * 5 * 0.85)
  const surplusDeficit = estDailyGeneration - totalDailyWh

  const deviceColumns: TableColumn[] = [
    { header: 'Device', key: 'name', flex: 2 },
    { header: 'Group', key: 'group', flex: 1 },
    { header: 'Watts', key: 'watts', flex: 0.8, align: 'right' },
    { header: 'Hrs/Day', key: 'hours', flex: 0.8, align: 'right' },
    { header: 'Wh/Day', key: 'whDay', flex: 1, align: 'right', bold: true },
  ]

  const deviceRows = devices.map((d) => ({
    name: d.name,
    group: d.group,
    watts: `${d.watts}W`,
    hours: `${d.hoursPerDay}h`,
    whDay: `${(d.watts * d.hoursPerDay).toLocaleString()} Wh`,
  }))

  const panelColumns: TableColumn[] = [
    { header: 'Make / Model', key: 'makeModel', flex: 2 },
    { header: 'Wattage', key: 'wattage', flex: 1, align: 'right' },
    { header: 'Qty', key: 'qty', flex: 0.6, align: 'right' },
    { header: 'Array Total', key: 'total', flex: 1.2, align: 'right', bold: true },
  ]

  const panelRows = panels.map((p) => ({
    makeModel: [p.make, p.model].filter(Boolean).join(' ') || 'Unknown',
    wattage: `${p.wattage ?? 0}W`,
    qty: String(p.quantity ?? 1),
    total: `${(p.wattage ?? 0) * (p.quantity ?? 1)}W`,
  }))

  const batteryColumns: TableColumn[] = [
    { header: 'Make / Model', key: 'makeModel', flex: 2 },
    { header: 'Type', key: 'type', flex: 1 },
    { header: 'Qty', key: 'qty', flex: 0.6, align: 'right' },
    { header: 'Weight', key: 'weight', flex: 1, align: 'right' },
  ]

  const batteryRows = batteries.map((b) => ({
    makeModel: [b.make, b.model].filter(Boolean).join(' ') || 'Unknown',
    type: b.equipmentType,
    qty: String(b.quantity ?? 1),
    weight: b.weight ? `${b.weight} lbs` : '—',
  }))

  const metrics = [
    {
      label: 'Daily Load',
      value: `${totalDailyWh.toLocaleString()} Wh`,
      subvalue: `${essentialWh.toLocaleString()} Wh essential`,
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
    {
      label: 'Solar Generation',
      value: `${estDailyGeneration.toLocaleString()} Wh`,
      subvalue: `${totalPanelW}W array · 5h avg`,
      bgColor: colors.amberLight,
      valueColor: colors.amber,
    },
    {
      label: surplusDeficit >= 0 ? 'Daily Surplus' : 'Daily Deficit',
      value: `${Math.abs(surplusDeficit).toLocaleString()} Wh`,
      bgColor: surplusDeficit >= 0 ? colors.greenLight : colors.redLight,
      valueColor: surplusDeficit >= 0 ? colors.green : colors.red,
    },
    {
      label: 'Devices Tracked',
      value: String(devices.length),
      subvalue: `${panels.length} panels · ${batteries.length} batteries`,
      bgColor: colors.sage,
    },
  ]

  return (
    <>
      {/* Page 1: Load Analysis */}
      <Page size="A4" style={styles.page}>
        <PageHeader
          imagePath="/images/page-headers/power_solar-header.jpg"
          badge="Department Report"
          title="Power & Solar Strategy"
          subtitle="Electrical load analysis and solar implementation"
        />

        <MetricRow metrics={metrics} />

        {/* Power balance summary bar */}
        <View style={styles.summaryBar}>
          {[
            { label: 'Total Devices', value: String(devices.length) },
            { label: 'Essential Wh/Day', value: `${essentialWh.toLocaleString()} Wh` },
            { label: 'Non-Essential Wh/Day', value: `${(totalDailyWh - essentialWh).toLocaleString()} Wh` },
            { label: 'Panel Array', value: `${totalPanelW}W` },
          ].map((item) => (
            <View key={item.label} style={styles.summaryBarItem}>
              <Text style={styles.summaryBarValue}>{item.value}</Text>
              <Text style={styles.summaryBarLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Electrical Load Analysis" />
        <PdfTable
          columns={deviceColumns}
          rows={deviceRows}
          emptyMessage="No electrical devices configured."
        />

        <PageFooter deptLabel="Power & Solar Strategy" pageLabel="Page 1" />
      </Page>

      {/* Page 2: Solar Equipment */}
      <Page size="A4" style={styles.page}>
        <View style={{ paddingTop: 28 }}>
          <SectionTitle title="Solar Panels" />
          <PdfTable
            columns={panelColumns}
            rows={panelRows}
            emptyMessage="No solar panels configured."
          />

          {batteries.length > 0 && (
            <>
              <SectionTitle title="Battery Bank" />
              <PdfTable
                columns={batteryColumns}
                rows={batteryRows}
                emptyMessage="No batteries configured."
              />
            </>
          )}

          {generators.length > 0 && (
            <>
              <SectionTitle title="Generators" />
              <PdfTable
                columns={[
                  { header: 'Make / Model', key: 'makeModel', flex: 2 },
                  { header: 'Output', key: 'output', flex: 1, align: 'right' },
                  { header: 'Qty', key: 'qty', flex: 0.6, align: 'right' },
                  { header: 'Weight', key: 'weight', flex: 1, align: 'right' },
                ]}
                rows={generators.map((g) => ({
                  makeModel: [g.make, g.model].filter(Boolean).join(' ') || 'Unknown',
                  output: `${g.wattage ?? 0}W`,
                  qty: String(g.quantity ?? 1),
                  weight: g.weight ? `${g.weight} lbs` : '—',
                }))}
              />
            </>
          )}

          {other.length > 0 && (
            <>
              <SectionTitle title="Other Equipment" />
              <PdfTable
                columns={[
                  { header: 'Make / Model', key: 'makeModel', flex: 2 },
                  { header: 'Type', key: 'type', flex: 1.5 },
                  { header: 'Qty', key: 'qty', flex: 0.6, align: 'right' },
                ]}
                rows={other.map((e) => ({
                  makeModel: [e.make, e.model].filter(Boolean).join(' ') || 'Unknown',
                  type: e.equipmentType,
                  qty: String(e.quantity ?? 1),
                }))}
              />
            </>
          )}
        </View>

        <PageFooter deptLabel="Power & Solar Strategy" pageLabel="Page 2" />
      </Page>
    </>
  )
}

export function PowerSolarReport(props: PowerSolarReportProps) {
  return (
    <Document>
      <PowerSolarPages {...props} />
    </Document>
  )
}
