import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { shared, colors, fonts } from '../styles'
import { PageHeader } from '../components/PageHeader'
import { MetricRow } from '../components/MetricRow'
import { SectionTitle } from '../components/SectionTitle'
import { PdfTable } from '../components/PdfTable'
import { formatDate } from '../utils'
import { PageFooter } from '../components/PageFooter'

const styles = StyleSheet.create({
  page: {
    ...shared.page,
  },
  footer: {
    ...shared.footer,
  },
  footerText: {
    ...shared.footerText,
  },
  rvProfileCard: {
    marginHorizontal: 30,
    marginTop: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sageLight,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  profileField: {
    minWidth: '28%',
  },
  profileLabel: {
    fontSize: fonts.sizeXs,
    color: colors.slateMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileValue: {
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
    color: colors.slateText,
  },
  eventRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  eventRowAlt: {
    backgroundColor: colors.sage,
  },
  eventDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  eventDate: {
    fontSize: fonts.sizeSm,
    color: colors.slateMid,
    width: 80,
  },
  eventTitle: {
    fontSize: fonts.sizeSm,
    color: colors.slateText,
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },
  eventSource: {
    fontSize: fonts.sizeXs,
    color: colors.slateMid,
    width: 70,
    textAlign: 'right',
  },
  eventsHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginHorizontal: 30,
    marginTop: 6,
  },
  eventsHeaderCell: {
    fontSize: fonts.sizeXs,
    color: colors.white,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  eventsBody: {
    marginHorizontal: 30,
  },
  noEvents: {
    paddingHorizontal: 30,
    fontSize: fonts.sizeSm,
    color: colors.slateMid,
    fontFamily: 'Helvetica-Oblique',
    marginTop: 8,
  },
})

interface RVVehicle {
  type?: string
  year?: number | string | null
  make?: string | null
  model?: string | null
  lengthFeet?: number | string | null
  dryWeightLbs?: number | string | null
  gvwrLbs?: number | string | null
}

interface UserProfile {
  firstName?: string | null
  lastName?: string | null
  planType?: string | null
  subscriptionStatus?: string | null
}

interface DashboardEvent {
  date: string | Date
  title: string
  description?: string
  color?: string
  source?: string
}

interface DashboardReportProps {
  rv?: RVVehicle | null
  profile?: UserProfile | null
  events?: DashboardEvent[]
}

export function DashboardPages({ rv, profile, events = [] }: DashboardReportProps) {
  const rvLabel = rv
    ? [rv.year, rv.make, rv.model].filter(Boolean).join(' ')
    : 'No RV configured'

  const userName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    : undefined

  const planLabel = profile?.planType
    ? profile.planType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Unknown'

  const statusLabel = profile?.subscriptionStatus
    ? profile.subscriptionStatus.charAt(0).toUpperCase() + profile.subscriptionStatus.slice(1)
    : '—'

  const metrics = [
    {
      label: 'Account',
      value: userName || 'RV Owner',
      subvalue: planLabel,
      bgColor: colors.primaryLight,
      valueColor: colors.primaryDark,
    },
    {
      label: 'Subscription',
      value: statusLabel,
      bgColor: colors.greenLight,
      valueColor: colors.green,
    },
    {
      label: 'RV Type',
      value: rv?.type ?? '—',
      bgColor: colors.sage,
    },
    {
      label: 'Events Upcoming',
      value: String(events.length),
      subvalue: 'scheduled',
      bgColor: colors.amberLight,
      valueColor: colors.amber,
    },
  ]

  return (
    <>
      <Page size="A4" style={styles.page}>
        <PageHeader
          imagePath="/images/page-headers/dashboard-header.jpg"
          badge="Department Report"
          title="Dashboard Overview"
          subtitle="Your RV profile and upcoming scheduled events"
        />

        <MetricRow metrics={metrics} />

        {/* RV Profile */}
        <SectionTitle title="Your RV" />
        <View style={styles.rvProfileCard}>
          {[
            { label: 'Year / Make / Model', value: rvLabel },
            { label: 'RV Type', value: rv?.type ?? '—' },
            { label: 'Length', value: rv?.lengthFeet ? `${rv.lengthFeet} ft` : '—' },
            { label: 'Dry Weight', value: rv?.dryWeightLbs ? `${Number(rv.dryWeightLbs).toLocaleString()} lbs` : '—' },
            { label: 'GVWR', value: rv?.gvwrLbs ? `${Number(rv.gvwrLbs).toLocaleString()} lbs` : '—' },
          ].map((f) => (
            <View key={f.label} style={styles.profileField}>
              <Text style={styles.profileLabel}>{f.label}</Text>
              <Text style={styles.profileValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Upcoming Events */}
        <SectionTitle title="Upcoming Events" />
        {events.length === 0 ? (
          <Text style={styles.noEvents}>No upcoming events scheduled.</Text>
        ) : (
          <>
            <View style={styles.eventsHeader}>
              <Text style={[styles.eventsHeaderCell, { width: 80 }]}>Date</Text>
              <Text style={[styles.eventsHeaderCell, { flex: 1, marginLeft: 8 }]}>Event</Text>
              <Text style={[styles.eventsHeaderCell, { width: 70, textAlign: 'right' }]}>Source</Text>
            </View>
            <View style={styles.eventsBody}>
              {events.slice(0, 20).map((ev, i) => (
                <View key={i} style={[styles.eventRow, i % 2 === 1 ? styles.eventRowAlt : {}]}>
                  <View style={[styles.eventDot, { backgroundColor: ev.color ?? colors.primary }]} />
                  <Text style={styles.eventDate}>{formatDate(ev.date)}</Text>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventSource}>{ev.source ?? '—'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <PageFooter deptLabel="Dashboard Overview" pageLabel="Page 1" />
      </Page>
    </>
  )
}

export function DashboardReport(props: DashboardReportProps) {
  return (
    <Document>
      <DashboardPages {...props} />
    </Document>
  )
}
