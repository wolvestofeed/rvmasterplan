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
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 30,
    marginTop: 6,
  },
  colBox: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    backgroundColor: colors.sage,
  },
  colBoxHeader: {
    fontSize: fonts.sizeXs,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  colLabel: {
    fontSize: fonts.sizeSm,
    color: colors.slateMid,
  },
  colValue: {
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
    color: colors.slateText,
  },
  highlightBox: {
    marginHorizontal: 30,
    marginTop: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  highlightItem: {
    alignItems: 'center',
  },
  highlightLabel: {
    fontSize: fonts.sizeXs,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  highlightValue: {
    fontSize: fonts.sizeLg,
    fontFamily: 'Helvetica-Bold',
    color: colors.primaryDark,
  },
  highlightSub: {
    fontSize: fonts.sizeXs,
    color: colors.primary,
    marginTop: 2,
  },
  dividerV: {
    width: 1,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  noDataText: {
    paddingHorizontal: 30,
    marginTop: 20,
    fontSize: fonts.sizeSm,
    color: colors.slateMid,
    fontFamily: 'Helvetica-Oblique',
  },
})

export interface FinancialData {
  purchasePrice?: string | number | null
  salesTaxRate?: string | number | null
  downPayment?: string | number | null
  tradeInValue?: string | number | null
  loanTermYears?: number | null
  interestRate?: string | number | null
  creditScore?: string | null
  registrationFees?: string | number | null
  insurance?: string | number | null
  extendedWarranty?: string | number | null
  accessories?: string | number | null
}

export interface RVData {
  type?: string | null
  year?: number | string | null
  make?: string | null
  model?: string | null
  lengthFeet?: number | string | null
  dryWeightLbs?: number | string | null
  gvwrLbs?: number | string | null
}

interface PurchaseCalcReportProps {
  financials?: FinancialData | null
  rv?: RVData | null
}

function n(v: string | number | null | undefined): number {
  return Number(v) || 0
}

export function PurchaseCalcPages({ financials, rv }: PurchaseCalcReportProps) {
  const f = financials ?? {}

  const purchasePrice = n(f.purchasePrice)
  const salesTaxRate = n(f.salesTaxRate)
  const downPayment = n(f.downPayment)
  const tradeInValue = n(f.tradeInValue)
  const loanTermYears = n(f.loanTermYears) || 5
  const interestRate = n(f.interestRate)
  const registrationFees = n(f.registrationFees)
  const insurance = n(f.insurance)
  const extendedWarranty = n(f.extendedWarranty)
  const accessories = n(f.accessories)

  const salesTaxAmount = purchasePrice * salesTaxRate / 100
  const loanAmount = Math.max(0, purchasePrice + salesTaxAmount - downPayment - tradeInValue)
  const monthlyRate = interestRate / 100 / 12
  const numPayments = loanTermYears * 12

  let monthlyPayment = 0
  let totalInterest = 0
  if (loanAmount > 0 && monthlyRate > 0 && numPayments > 0) {
    monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    totalInterest = monthlyPayment * numPayments - loanAmount
  }

  const totalInsurance = insurance * loanTermYears
  const totalCostOfOwnership = purchasePrice + salesTaxAmount + registrationFees + totalInsurance + extendedWarranty + accessories + totalInterest - downPayment - tradeInValue

  const hasData = purchasePrice > 0

  const rvLabel = [rv?.year, rv?.make, rv?.model].filter(Boolean).join(' ')

  const metrics = [
    {
      label: 'Monthly Payment',
      value: monthlyPayment > 0 ? formatCurrency(monthlyPayment) : '—',
      subvalue: `${loanTermYears} yr loan`,
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
    {
      label: 'Loan Amount',
      value: loanAmount > 0 ? formatCurrency(loanAmount) : '—',
      bgColor: colors.sage,
    },
    {
      label: 'Total Interest',
      value: totalInterest > 0 ? formatCurrency(totalInterest) : '—',
      bgColor: colors.amberLight,
      valueColor: colors.amber,
    },
    {
      label: 'Total Cost of Ownership',
      value: totalCostOfOwnership > 0 ? formatCurrency(totalCostOfOwnership) : '—',
      subvalue: `over ${loanTermYears} yrs`,
      bgColor: colors.purpleLight,
      valueColor: colors.purple,
    },
  ]

  // Purchase summary rows
  const summaryColumns: TableColumn[] = [
    { header: 'Line Item', key: 'item', flex: 2 },
    { header: 'Amount', key: 'amount', flex: 1, align: 'right', bold: true },
    { header: 'Notes', key: 'notes', flex: 2 },
  ]

  const summaryRows = [
    { item: 'Purchase Price', amount: formatCurrency(purchasePrice), notes: rvLabel },
    { item: 'Sales Tax', amount: formatCurrency(salesTaxAmount), notes: `${salesTaxRate}% rate` },
    { item: 'Down Payment', amount: `(${formatCurrency(downPayment)})`, notes: 'Applied at closing' },
    { item: 'Trade-in Value', amount: `(${formatCurrency(tradeInValue)})`, notes: 'Applied at closing' },
    { item: 'Loan Amount', amount: formatCurrency(loanAmount), notes: 'Financed balance' },
    { item: 'Registration & Fees', amount: formatCurrency(registrationFees), notes: 'One-time' },
    { item: 'Extended Warranty', amount: formatCurrency(extendedWarranty), notes: 'One-time' },
    { item: 'Accessories & Upgrades', amount: formatCurrency(accessories), notes: 'One-time' },
    { item: `Insurance (${loanTermYears} yrs)`, amount: formatCurrency(totalInsurance), notes: `${formatCurrency(insurance)}/yr` },
    { item: 'Total Interest Paid', amount: formatCurrency(totalInterest), notes: `${interestRate}% APR` },
  ]

  // Year-by-year amortization overview
  const yearColumns: TableColumn[] = [
    { header: 'Year', key: 'yr', flex: 0.6 },
    { header: 'Payments Made', key: 'payments', flex: 1, align: 'right' },
    { header: 'Principal Paid', key: 'principal', flex: 1.2, align: 'right' },
    { header: 'Interest Paid', key: 'interest', flex: 1.2, align: 'right' },
    { header: 'Balance Remaining', key: 'balance', flex: 1.4, align: 'right', bold: true },
  ]

  const yearRows: Record<string, string>[] = []
  if (loanAmount > 0 && monthlyPayment > 0) {
    let balance = loanAmount
    for (let yr = 1; yr <= loanTermYears; yr++) {
      let principalPaid = 0
      let interestPaid = 0
      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break
        const intCharge = balance * monthlyRate
        const principalCharge = Math.min(monthlyPayment - intCharge, balance)
        interestPaid += intCharge
        principalPaid += principalCharge
        balance -= principalCharge
      }
      yearRows.push({
        yr: `Year ${yr}`,
        payments: formatCurrency(monthlyPayment * 12),
        principal: formatCurrency(principalPaid),
        interest: formatCurrency(interestPaid),
        balance: formatCurrency(Math.max(0, balance)),
      })
    }
  }

  return (
    <>
      <Page size="A4" style={styles.page}>
        <PageHeader
          imagePath="/images/page-headers/purchase-header.png"
          badge="Department Report"
          title="RV Purchase Calculator"
          subtitle="Loan terms, monthly payment & total cost of ownership"
        />

        {!hasData ? (
          <Text style={styles.noDataText}>
            No purchase data found. Enter your RV purchase details in the Purchase Calculator to generate this report.
          </Text>
        ) : (
          <>
            <MetricRow metrics={metrics} />

            <SectionTitle title="Purchase & Financing Summary" />
            <PdfTable
              columns={summaryColumns}
              rows={summaryRows}
              emptyMessage="No financial data available."
            />

            <SectionTitle title="Loan Details" />
            <View style={styles.twoCol}>
              <View style={styles.colBox}>
                <Text style={styles.colBoxHeader}>Loan Parameters</Text>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Loan Term</Text>
                  <Text style={styles.colValue}>{loanTermYears} years ({numPayments} payments)</Text>
                </View>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Interest Rate (APR)</Text>
                  <Text style={styles.colValue}>{interestRate}%</Text>
                </View>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Credit Score</Text>
                  <Text style={styles.colValue}>{f.creditScore || '—'}</Text>
                </View>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Monthly Payment</Text>
                  <Text style={styles.colValue}>{formatCurrency(monthlyPayment)}</Text>
                </View>
              </View>

              <View style={styles.colBox}>
                <Text style={styles.colBoxHeader}>RV Profile</Text>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Type</Text>
                  <Text style={styles.colValue}>{rv?.type || '—'}</Text>
                </View>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Year / Make / Model</Text>
                  <Text style={styles.colValue}>{rvLabel || '—'}</Text>
                </View>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>Length</Text>
                  <Text style={styles.colValue}>{rv?.lengthFeet ? `${rv.lengthFeet} ft` : '—'}</Text>
                </View>
                <View style={styles.colRow}>
                  <Text style={styles.colLabel}>GVWR</Text>
                  <Text style={styles.colValue}>{rv?.gvwrLbs ? `${Number(rv.gvwrLbs).toLocaleString()} lbs` : '—'}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <PageFooter deptLabel="RV Purchase Calculator" pageLabel="Page 1" />
      </Page>

      {hasData && yearRows.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={{ paddingTop: 28 }}>
            <SectionTitle title="Annual Amortization Overview" />
            <PdfTable
              columns={yearColumns}
              rows={yearRows}
              emptyMessage="No amortization data available."
            />
          </View>
          <PageFooter deptLabel="RV Purchase Calculator" pageLabel="Page 2" />
        </Page>
      )}
    </>
  )
}

export function PurchaseCalcReport(props: PurchaseCalcReportProps) {
  return (
    <Document>
      <PurchaseCalcPages {...props} />
    </Document>
  )
}
