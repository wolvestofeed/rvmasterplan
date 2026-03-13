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
  headerPage: { ...shared.headerPage },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  summaryRowAlt: { backgroundColor: colors.sage },
  summaryMonthHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.primaryDark,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  summaryHeaderCell: {
    fontSize: fonts.sizeXs,
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryCell: {
    fontSize: fonts.sizeSm,
    color: colors.slateText,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.primaryLight,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
  },
  summaryFooterCell: {
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDark,
  },
  variancePositive: { color: colors.green },
  varianceNegative: { color: colors.red },
})

export interface ExpenseItem {
  id?: string
  name: string
  group: string
  category: string
  costPerItem: number
  quantity: number
  tax: number
  month: number
  year: number
}

export interface MonthlyBudget {
  month: number
  year: number
  budgetedAmount: number
}

interface LivingBudgetReportProps {
  expenses: ExpenseItem[]
  budgets: MonthlyBudget[]
  year?: number
}

export function LivingBudgetPages({ expenses, budgets, year }: LivingBudgetReportProps) {
  const currentYear = year ?? new Date().getFullYear()

  // Group expenses by month
  const monthMap: Record<number, { total: number; count: number }> = {}
  expenses.forEach((e) => {
    const sub = e.costPerItem * e.quantity
    const total = sub + (sub * e.tax / 100)
    if (!monthMap[e.month]) monthMap[e.month] = { total: 0, count: 0 }
    monthMap[e.month].total += total
    monthMap[e.month].count++
  })

  const totalExpenses = Object.values(monthMap).reduce((s, m) => s + m.total, 0)

  const budgetMap: Record<number, number> = {}
  budgets.forEach((b) => { budgetMap[b.month] = b.budgetedAmount })

  const annualBudget = Object.values(budgetMap).reduce((s, v) => s + v, 0)
  const remaining = annualBudget - totalExpenses

  const summaryMonths = Array.from(new Set([
    ...Object.keys(monthMap).map(Number),
    ...Object.keys(budgetMap).map(Number),
  ])).sort((a, b) => a - b)

  const totalBudget = summaryMonths.reduce((s, m) => s + (budgetMap[m] ?? 0), 0)
  const totalSpent = summaryMonths.reduce((s, m) => s + (monthMap[m]?.total ?? 0), 0)

  // Expense ledger columns
  const ledgerColumns: TableColumn[] = [
    { header: 'Expense', key: 'name', flex: 2 },
    { header: 'Category', key: 'category', flex: 1.4 },
    { header: 'Group', key: 'group', flex: 1 },
    { header: 'Period', key: 'period', flex: 1 },
    { header: 'Amount', key: 'amount', flex: 1, align: 'right', bold: true },
  ]

  const ledgerRows = expenses.map((e) => {
    const sub = e.costPerItem * e.quantity
    const total = sub + (sub * e.tax / 100)
    return {
      name: e.name,
      category: e.category,
      group: e.group,
      period: `${MONTH_NAMES[e.month] ?? `Month ${e.month}`} ${e.year}`,
      amount: formatCurrency(total),
    }
  })

  const metrics = [
    {
      label: 'Total YTD Expenses',
      value: formatCurrency(totalExpenses),
      bgColor: colors.purpleLight,
      valueColor: colors.purple,
    },
    {
      label: 'Annual Budget',
      value: formatCurrency(annualBudget),
      bgColor: colors.sage,
    },
    {
      label: remaining >= 0 ? 'Budget Remaining' : 'Over Budget',
      value: formatCurrency(Math.abs(remaining)),
      bgColor: remaining >= 0 ? colors.greenLight : colors.redLight,
      valueColor: remaining >= 0 ? colors.green : colors.red,
    },
    {
      label: 'Expense Entries',
      value: String(expenses.length),
      subvalue: `for ${currentYear}`,
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
  ]

  return (
    <>
      {/* Page 1: Summary + Monthly breakdown */}
      <Page size="A4" style={styles.headerPage}>
        <PageHeader
          imagePath="/images/page-headers/living-budget-header.jpg"
          badge="Department Report"
          title="RV Living Budget"
          subtitle={`${currentYear} expenses, targets & financial overview`}
        />

        <MetricRow metrics={metrics} />

        {/* Monthly Summary */}
        <SectionTitle title="Monthly Summary" />
        <View style={{ marginHorizontal: 30, marginTop: 6 }}>
          <View style={styles.summaryMonthHeader}>
            <Text style={[styles.summaryHeaderCell, { flex: 1.5 }]}>Month</Text>
            <Text style={[styles.summaryHeaderCell, { flex: 0.6, textAlign: 'right' }]}># Items</Text>
            <Text style={[styles.summaryHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Spent</Text>
            <Text style={[styles.summaryHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Budget</Text>
            <Text style={[styles.summaryHeaderCell, { flex: 1.2, textAlign: 'right' }]}>Variance</Text>
          </View>
          {summaryMonths.map((m, i) => {
            const spent = monthMap[m]?.total ?? 0
            const budget = budgetMap[m] ?? 0
            const variance = budget - spent
            return (
              <View key={m} style={[styles.summaryRow, i % 2 === 1 ? styles.summaryRowAlt : {}]}>
                <Text style={[styles.summaryCell, { flex: 1.5, fontFamily: 'Helvetica-Bold' }]}>
                  {MONTH_NAMES[m] ?? `Month ${m}`}
                </Text>
                <Text style={[styles.summaryCell, { flex: 0.6, textAlign: 'right' }]}>
                  {monthMap[m]?.count ?? 0}
                </Text>
                <Text style={[styles.summaryCell, { flex: 1.2, textAlign: 'right' }]}>
                  {formatCurrency(spent)}
                </Text>
                <Text style={[styles.summaryCell, { flex: 1.2, textAlign: 'right' }]}>
                  {budget ? formatCurrency(budget) : '—'}
                </Text>
                <Text style={[
                  styles.summaryCell,
                  { flex: 1.2, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
                  variance >= 0 ? styles.variancePositive : styles.varianceNegative,
                ]}>
                  {budget ? (variance >= 0 ? '+' : '') + formatCurrency(variance) : '—'}
                </Text>
              </View>
            )
          })}
          {/* Totals footer */}
          <View style={styles.summaryFooterRow}>
            <Text style={[styles.summaryFooterCell, { flex: 1.5 }]}>Total</Text>
            <Text style={[styles.summaryFooterCell, { flex: 0.6, textAlign: 'right' }]}>
              {expenses.length}
            </Text>
            <Text style={[styles.summaryFooterCell, { flex: 1.2, textAlign: 'right' }]}>
              {formatCurrency(totalSpent)}
            </Text>
            <Text style={[styles.summaryFooterCell, { flex: 1.2, textAlign: 'right' }]}>
              {formatCurrency(totalBudget)}
            </Text>
            <Text style={[
              styles.summaryFooterCell,
              { flex: 1.2, textAlign: 'right' },
              (totalBudget - totalSpent) >= 0 ? styles.variancePositive : styles.varianceNegative,
            ]}>
              {totalBudget ? ((totalBudget - totalSpent) >= 0 ? '+' : '') + formatCurrency(totalBudget - totalSpent) : '—'}
            </Text>
          </View>
        </View>

        <PageFooter deptLabel="RV Living Budget" pageLabel="Page 1" />
      </Page>

      {/* Page 2: Expense Ledger */}
      <Page size="A4" style={styles.page}>
        <SectionTitle title="Expense Ledger" />
        <PdfTable
          columns={ledgerColumns}
          rows={ledgerRows}
          emptyMessage="No expenses recorded for this period."
        />
        <PageFooter deptLabel="RV Living Budget" pageLabel="Page 2" />
      </Page>
    </>
  )
}

export function LivingBudgetReport(props: LivingBudgetReportProps) {
  return (
    <Document>
      <LivingBudgetPages {...props} />
    </Document>
  )
}
