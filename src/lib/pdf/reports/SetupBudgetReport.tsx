import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { shared, colors, fonts } from '../styles'
import { PageHeader } from '../components/PageHeader'
import { MetricRow } from '../components/MetricRow'
import { SectionTitle } from '../components/SectionTitle'
import { PdfTable, TableColumn } from '../components/PdfTable'
import { formatCurrency } from '../utils'
import { PageFooter } from '../components/PageFooter'

const styles = StyleSheet.create({
  page: { ...shared.page },
  headerPage: { ...shared.headerPage },
  categorySection: {
    marginHorizontal: 30,
    marginTop: 6,
  },
  catHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  catHeaderCell: {
    fontSize: fonts.sizeXs,
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  catDataRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  catDataRowAlt: { backgroundColor: colors.sage },
  catFooterRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    marginBottom: 14,
  },
  catCell: {
    fontSize: fonts.sizeSm,
    color: colors.slateText,
  },
  catFooterCell: {
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDark,
  },
  statusAcquired: { color: colors.green },
  statusPending: { color: colors.amber },
})

const CATEGORY_ORDER = ['ENERGY', 'TOWING', 'BRAKES', 'WATER', 'STORAGE', 'RENOVATIONS', 'SECURITY', 'OTHER']

export interface SetupItem {
  id?: string
  name: string
  category: string
  priority: string
  cost: number | string
  weight: number | string
  isAcquired: boolean
  notes?: string | null
  purchaseDeadline?: string | null
}

interface SetupBudgetReportProps {
  items: SetupItem[]
}

export function SetupBudgetPages({ items }: SetupBudgetReportProps) {
  const totalCost = items.reduce((s, i) => s + Number(i.cost || 0), 0)
  const acquiredCost = items.filter((i) => i.isAcquired).reduce((s, i) => s + Number(i.cost || 0), 0)
  const remainingCost = totalCost - acquiredCost
  const totalWeight = items.reduce((s, i) => s + Number(i.weight || 0), 0)
  const acquiredCount = items.filter((i) => i.isAcquired).length

  const metrics = [
    {
      label: 'Total Estimated Cost',
      value: formatCurrency(totalCost),
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
    {
      label: 'Acquired / Spent',
      value: formatCurrency(acquiredCost),
      subvalue: `${acquiredCount} of ${items.length} items`,
      bgColor: colors.greenLight,
      valueColor: colors.green,
    },
    {
      label: 'Still to Purchase',
      value: formatCurrency(remainingCost),
      subvalue: `${items.length - acquiredCount} items remaining`,
      bgColor: colors.amberLight,
      valueColor: colors.amber,
    },
    {
      label: 'Total Added Weight',
      value: `${totalWeight.toLocaleString()} lbs`,
      bgColor: colors.sage,
    },
  ]

  // Full equipment list columns
  const listColumns: TableColumn[] = [
    { header: 'Item', key: 'name', flex: 2 },
    { header: 'Category', key: 'category', flex: 1.2 },
    { header: 'Priority', key: 'priority', flex: 1.2 },
    { header: 'Cost', key: 'cost', flex: 0.9, align: 'right', bold: true },
    { header: 'Weight (lbs)', key: 'weight', flex: 0.8, align: 'right' },
    { header: 'Status', key: 'status', flex: 0.8, align: 'center' },
  ]

  const listRows = items.map((item) => ({
    name: item.name,
    category: item.category,
    priority: item.priority,
    cost: formatCurrency(Number(item.cost || 0)),
    weight: Number(item.weight || 0).toString(),
    status: item.isAcquired ? 'Acquired' : 'Pending',
  }))

  // Category summary
  const catMap: Record<string, { count: number; acquired: number; cost: number; weight: number }> = {}
  items.forEach((item) => {
    const cat = item.category || 'OTHER'
    if (!catMap[cat]) catMap[cat] = { count: 0, acquired: 0, cost: 0, weight: 0 }
    catMap[cat].count++
    catMap[cat].cost += Number(item.cost || 0)
    catMap[cat].weight += Number(item.weight || 0)
    if (item.isAcquired) catMap[cat].acquired++
  })

  const catOrder = CATEGORY_ORDER.filter((c) => catMap[c]).concat(
    Object.keys(catMap).filter((c) => !CATEGORY_ORDER.includes(c))
  )

  return (
    <>
      {/* Page 1: Metrics + Category Summary */}
      <Page size="A4" style={styles.headerPage}>
        <PageHeader
          imagePath="/images/page-headers/rvmp-setup-header.jpg"
          badge="Department Report"
          title="RV Setup Budget"
          subtitle="Equipment list, acquisition status & cost by category"
        />

        <MetricRow metrics={metrics} />

        <SectionTitle title="Category Summary" />
        <View style={styles.categorySection}>
          <View style={styles.catHeaderRow}>
            <Text style={[styles.catHeaderCell, { flex: 1.5 }]}>Category</Text>
            <Text style={[styles.catHeaderCell, { flex: 0.7, textAlign: 'right' }]}># Items</Text>
            <Text style={[styles.catHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Acquired</Text>
            <Text style={[styles.catHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Total Cost</Text>
            <Text style={[styles.catHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Weight (lbs)</Text>
          </View>
          {catOrder.map((cat, i) => {
            const d = catMap[cat]
            return (
              <View key={cat} style={[styles.catDataRow, i % 2 === 1 ? styles.catDataRowAlt : {}]}>
                <Text style={[styles.catCell, { flex: 1.5, fontFamily: 'Helvetica-Bold' }]}>{cat}</Text>
                <Text style={[styles.catCell, { flex: 0.7, textAlign: 'right' }]}>{d.count}</Text>
                <Text style={[styles.catCell, { flex: 0.8, textAlign: 'right' }]}>{d.acquired}/{d.count}</Text>
                <Text style={[styles.catCell, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(d.cost)}</Text>
                <Text style={[styles.catCell, { flex: 1.2, textAlign: 'right' }]}>{d.weight.toLocaleString()}</Text>
              </View>
            )
          })}
          <View style={styles.catFooterRow}>
            <Text style={[styles.catFooterCell, { flex: 1.5 }]}>Total</Text>
            <Text style={[styles.catFooterCell, { flex: 0.7, textAlign: 'right' }]}>{items.length}</Text>
            <Text style={[styles.catFooterCell, { flex: 0.8, textAlign: 'right' }]}>{acquiredCount}/{items.length}</Text>
            <Text style={[styles.catFooterCell, { flex: 1.2, textAlign: 'right' }]}>{formatCurrency(totalCost)}</Text>
            <Text style={[styles.catFooterCell, { flex: 1.2, textAlign: 'right' }]}>{totalWeight.toLocaleString()}</Text>
          </View>
        </View>

        <PageFooter deptLabel="RV Setup Budget" pageLabel="Page 1" />
      </Page>

      {/* Page 2: Full Equipment List */}
      <Page size="A4" style={styles.page}>
        <SectionTitle title="Full Equipment List" />
        <PdfTable
          columns={listColumns}
          rows={listRows}
          emptyMessage="No equipment items recorded."
        />
        <PageFooter deptLabel="RV Setup Budget" pageLabel="Page 2" />
      </Page>
    </>
  )
}

export function SetupBudgetReport(props: SetupBudgetReportProps) {
  return (
    <Document>
      <SetupBudgetPages {...props} />
    </Document>
  )
}
