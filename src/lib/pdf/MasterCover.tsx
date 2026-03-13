import React from 'react'
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { colors, fonts, shared } from './styles'
import { pdfImageUrl } from './utils'
import { PageFooter } from './components/PageFooter'

const styles = StyleSheet.create({
  // ── Page 1: Hero cover ──────────────────────────────────────────
  coverPage: {
    ...shared.page,
    paddingBottom: 0,
    padding: 0,
  },
  coverWrapper: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 40,
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  logo: {
    width: 320,
    height: 90,
    objectFit: 'contain',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainTitle: {
    color: colors.white,
    fontSize: fonts.size3xl,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.1,
    marginBottom: 14,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginBottom: 14,
  },
  tagline: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: fonts.sizeMd,
    maxWidth: 360,
    lineHeight: 1.5,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: 'rgba(80,136,156,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(80,136,156,0.6)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  metaChipText: {
    color: colors.white,
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Page 2: TOC page ────────────────────────────────────────────
  tocPage: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.sage,
  },
  tocPageInner: {
    flex: 1,
    paddingHorizontal: 50,
    paddingTop: 60,
    paddingBottom: 50,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  tocHeader: {
    marginBottom: 40,
  },
  tocEyebrow: {
    color: colors.primary,
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tocMainTitle: {
    color: colors.slateText,
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.1,
    marginBottom: 10,
  },
  tocDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginBottom: 14,
  },
  tocSubtitle: {
    color: colors.slateMid,
    fontSize: fonts.sizeMd,
    lineHeight: 1.5,
    maxWidth: 380,
  },
  tocMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  tocMetaChip: {
    backgroundColor: 'rgba(80,136,156,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(80,136,156,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tocMetaChipText: {
    color: colors.primaryDark,
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
  },
  tocBody: {
    flex: 1,
  },
  tocSectionLabel: {
    color: colors.slateMid,
    fontSize: fonts.sizeXs,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80,136,156,0.18)',
  },
  tocRowNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tocRowNumText: {
    color: colors.white,
    fontSize: fonts.sizeSm,
    fontFamily: 'Helvetica-Bold',
  },
  tocRowTitle: {
    color: colors.slateText,
    fontSize: fonts.sizeMd,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  tocRowArrow: {
    color: colors.primary,
    fontSize: fonts.sizeMd,
    fontFamily: 'Helvetica-Bold',
  },
  tocFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(80,136,156,0.25)',
    paddingTop: 14,
  },
  tocFooterText: {
    color: colors.slateMid,
    fontSize: fonts.sizeXs,
  },
  tocFooterLogo: {
    width: 100,
    height: 28,
    objectFit: 'contain',
  },
})

const TOC_ITEMS = [
  'Dashboard Overview',
  'RV Purchase Calculator',
  'RV Setup Budget',
  'RV Living Budget',
  'Fuel Economy',
  'Power & Solar Strategy',
  'Water Management',
  'Documents & Renewals',
]

interface MasterCoverProps {
  userName?: string
  rvLabel?: string
}

export function MasterCover({ userName, rvLabel }: MasterCoverProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  const chips = [userName, rvLabel].filter(Boolean)

  return (
    <>
      {/* ── Page 1: Full-bleed hero cover ── */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverWrapper}>
        <Image src={pdfImageUrl('/images/page-headers/rvmp-masterplan-cover.jpg')} style={styles.heroImage} />
        <View style={styles.overlay} />

        <View style={styles.contentContainer}>
          {/* Top: transparent logo centered */}
          <View style={styles.topSection}>
            <Image src={pdfImageUrl('/images/logos/RV-MasterPlan_logo-header.jpg')} style={styles.logo} />
          </View>

          {/* Center: title block */}
          <View style={styles.centerSection}>
            <Text style={styles.eyebrow}>Comprehensive Strategy</Text>
            <Text style={styles.mainTitle}>RV MasterPlan</Text>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              {userName && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{userName}</Text>
                </View>
              )}
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{today}</Text>
              </View>
            </View>
          </View>
        </View>
        </View>
      </Page>

      {/* ── Page 2: Titles + Table of Contents ── */}
      <Page size="A4" style={styles.tocPage}>
        <View style={styles.tocPageInner}>

          {/* Header */}
          <View style={styles.tocHeader}>
            <Text style={styles.tocEyebrow}>Comprehensive Strategy</Text>
            <Text style={styles.tocMainTitle}>RV MasterPlan</Text>
            <View style={styles.tocDivider} />
            <Text style={styles.tocSubtitle}>
              Your complete RV lifestyle strategy — budgets, power systems, water management, and more, compiled into one document.
            </Text>
            {chips.length > 0 && (
              <View style={styles.tocMeta}>
                {chips.map((c) => (
                  <View key={c} style={styles.tocMetaChip}>
                    <Text style={styles.tocMetaChipText}>{c}</Text>
                  </View>
                ))}
                <View style={styles.tocMetaChip}>
                  <Text style={styles.tocMetaChipText}>{today}</Text>
                </View>
              </View>
            )}
          </View>

          {/* TOC list */}
          <View style={styles.tocBody}>
            <Text style={styles.tocSectionLabel}>Table of Contents</Text>
            {TOC_ITEMS.map((item, i) => (
              <View key={item} style={styles.tocRow}>
                <View style={styles.tocRowNum}>
                  <Text style={styles.tocRowNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.tocRowTitle}>{item}</Text>
                <Text style={styles.tocRowArrow}>›</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.tocFooter}>
            <Text style={styles.tocFooterText}>RV MasterPlan  ·  {today}</Text>
            <Image src={pdfImageUrl('/images/logos/rv-masterplan-logo-landscape.png')} style={styles.tocFooterLogo} />
          </View>

        </View>
        <PageFooter deptLabel="Table of Contents" />
      </Page>
    </>
  )
}
