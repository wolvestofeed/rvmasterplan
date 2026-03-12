import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { colors, fonts } from '../styles'
import { pdfImageUrl } from '../utils'

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 160,
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingBottom: 18,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: fonts.sizeXs,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.white,
    fontSize: fonts.size2xl,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: fonts.sizeSm,
    marginTop: 4,
  },
  dateBar: {
    position: 'absolute',
    top: 14,
    right: 30,
    color: 'rgba(255,255,255,0.85)',
    fontSize: fonts.sizeBase,
  },
})

interface PageHeaderProps {
  imagePath: string
  badge: string
  title: string
  subtitle?: string
}

export function PageHeader({ imagePath, badge, title, subtitle }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      <Image src={pdfImageUrl(imagePath)} style={styles.heroImage} />
      <View style={styles.overlay} />
      <Text style={styles.dateBar}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
      <View style={styles.textContainer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  )
}
