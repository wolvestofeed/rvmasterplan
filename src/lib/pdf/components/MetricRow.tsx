import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fonts } from '../styles'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 30,
  },
  card: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: fonts.sizeXs,
    color: colors.slateMid,
    fontFamily: 'Helvetica',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: fonts.sizeLg,
    fontFamily: 'Helvetica-Bold',
    color: colors.slateText,
    lineHeight: 1.1,
  },
  subvalue: {
    fontSize: fonts.sizeXs,
    color: colors.slateMid,
    marginTop: 2,
  },
})

export interface MetricItem {
  label: string
  value: string
  subvalue?: string
  bgColor?: string
  valueColor?: string
}

interface MetricRowProps {
  metrics: MetricItem[]
}

export function MetricRow({ metrics }: MetricRowProps) {
  return (
    <View style={styles.row}>
      {metrics.map((m, i) => (
        <View
          key={i}
          style={[
            styles.card,
            { backgroundColor: m.bgColor ?? colors.sage },
          ]}
        >
          <Text style={styles.label}>{m.label}</Text>
          <Text style={[styles.value, m.valueColor ? { color: m.valueColor } : {}]}>
            {m.value}
          </Text>
          {m.subvalue && <Text style={styles.subvalue}>{m.subvalue}</Text>}
        </View>
      ))}
    </View>
  )
}
