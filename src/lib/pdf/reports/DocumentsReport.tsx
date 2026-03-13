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
  renewalSection: {
    marginHorizontal: 30,
    marginTop: 6,
  },
  renewalHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.amber,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  renewalHeaderCell: {
    fontSize: fonts.sizeXs,
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  renewalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  renewalRowAlt: { backgroundColor: colors.amberLight },
  renewalCell: {
    fontSize: fonts.sizeSm,
    color: colors.slateText,
  },
  urgentCell: {
    color: colors.red,
    fontFamily: 'Helvetica-Bold',
  },
  soonCell: {
    color: colors.amber,
    fontFamily: 'Helvetica-Bold',
  },
})

export interface DocumentItem {
  id?: string
  title: string
  fileType: string
  renewalDate?: Date | string | null
  renewalCost?: string | number | null
  createdAt?: Date | string
}

interface DocumentsReportProps {
  documents: DocumentItem[]
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null
  try {
    const diff = new Date(d).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

export function DocumentsPages({ documents }: DocumentsReportProps) {
  const today = new Date()

  const withRenewal = documents.filter((d) => d.renewalDate)
  const annualRenewalCost = withRenewal.reduce((s, d) => s + Number(d.renewalCost || 0), 0)

  const upcoming30 = withRenewal.filter((d) => {
    const days = daysUntil(d.renewalDate)
    return days !== null && days >= 0 && days <= 30
  })
  const upcoming90 = withRenewal.filter((d) => {
    const days = daysUntil(d.renewalDate)
    return days !== null && days >= 0 && days <= 90
  })

  const metrics = [
    {
      label: 'Total Documents',
      value: String(documents.length),
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
    {
      label: 'Due in 30 Days',
      value: String(upcoming30.length),
      bgColor: upcoming30.length > 0 ? colors.redLight : colors.greenLight,
      valueColor: upcoming30.length > 0 ? colors.red : colors.green,
    },
    {
      label: 'Due in 90 Days',
      value: String(upcoming90.length),
      bgColor: upcoming90.length > 0 ? colors.amberLight : colors.sage,
      valueColor: upcoming90.length > 0 ? colors.amber : undefined,
    },
    {
      label: 'Annual Renewal Cost',
      value: formatCurrency(annualRenewalCost),
      subvalue: `${withRenewal.length} docs with renewal dates`,
      bgColor: colors.purpleLight,
      valueColor: colors.purple,
    },
  ]

  // Full document list
  const docColumns: TableColumn[] = [
    { header: 'Document', key: 'title', flex: 2.5 },
    { header: 'Type', key: 'fileType', flex: 1 },
    { header: 'Renewal Date', key: 'renewalDate', flex: 1.2 },
    { header: 'Annual Cost', key: 'cost', flex: 1, align: 'right', bold: true },
  ]

  const docRows = documents.map((d) => ({
    title: d.title,
    fileType: d.fileType,
    renewalDate: formatDate(d.renewalDate),
    cost: d.renewalCost ? formatCurrency(Number(d.renewalCost)) : '—',
  }))

  // Upcoming renewals sorted by date
  const renewalsSorted = [...withRenewal]
    .filter((d) => {
      const days = daysUntil(d.renewalDate)
      return days !== null && days >= -30 // include recently expired
    })
    .sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime())
    .slice(0, 20)

  return (
    <>
      {/* Page 1: Metrics + Upcoming Renewals */}
      <Page size="A4" style={styles.headerPage}>
        <PageHeader
          imagePath="/images/page-headers/documents-header.png"
          badge="Department Report"
          title="Documents & Renewals"
          subtitle="Document registry, renewal dates & annual cost summary"
        />

        <MetricRow metrics={metrics} />

        <SectionTitle title="Upcoming Renewals" />
        {renewalsSorted.length === 0 ? (
          <Text style={{ paddingHorizontal: 30, marginTop: 8, fontSize: fonts.sizeSm, color: colors.slateMid, fontFamily: 'Helvetica-Oblique' }}>
            No upcoming renewals in the next 90 days.
          </Text>
        ) : (
          <View style={styles.renewalSection}>
            <View style={styles.renewalHeaderRow}>
              <Text style={[styles.renewalHeaderCell, { flex: 2.5 }]}>Document</Text>
              <Text style={[styles.renewalHeaderCell, { flex: 1.2 }]}>Renewal Date</Text>
              <Text style={[styles.renewalHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Days Left</Text>
              <Text style={[styles.renewalHeaderCell, { flex: 1, textAlign: 'right' }]}>Cost</Text>
            </View>
            {renewalsSorted.map((d, i) => {
              const days = daysUntil(d.renewalDate)
              const isUrgent = days !== null && days <= 30
              const isSoon = days !== null && days > 30 && days <= 60
              return (
                <View key={d.id ?? i} style={[styles.renewalRow, i % 2 === 1 ? styles.renewalRowAlt : {}]}>
                  <Text style={[styles.renewalCell, { flex: 2.5, fontFamily: 'Helvetica-Bold' }]}>{d.title}</Text>
                  <Text style={[styles.renewalCell, { flex: 1.2 }]}>{formatDate(d.renewalDate)}</Text>
                  <Text style={[
                    styles.renewalCell,
                    { flex: 0.8, textAlign: 'right' },
                    isUrgent ? styles.urgentCell : isSoon ? styles.soonCell : {},
                  ]}>
                    {days !== null ? (days < 0 ? `${Math.abs(days)}d ago` : `${days}d`) : '—'}
                  </Text>
                  <Text style={[styles.renewalCell, { flex: 1, textAlign: 'right' }]}>
                    {d.renewalCost ? formatCurrency(Number(d.renewalCost)) : '—'}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        <PageFooter deptLabel="Documents & Renewals" pageLabel="Page 1" />
      </Page>

      {/* Page 2: Full Document Registry */}
      <Page size="A4" style={styles.page}>
        <SectionTitle title="Full Document Registry" />
        <PdfTable
          columns={docColumns}
          rows={docRows}
          emptyMessage="No documents on file."
        />
        <PageFooter deptLabel="Documents & Renewals" pageLabel="Page 2" />
      </Page>
    </>
  )
}

export function DocumentsReport(props: DocumentsReportProps) {
  return (
    <Document>
      <DocumentsPages {...props} />
    </Document>
  )
}
