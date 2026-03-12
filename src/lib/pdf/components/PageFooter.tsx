import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fonts } from '../styles'

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  copyright: {
    fontSize: fonts.sizeXs,
    color: colors.slateLight,
  },
  pageLabel: {
    fontSize: fonts.sizeXs,
    color: colors.slateLight,
  },
})

// "RV MasterPlan™ © 2026 All Rights Reserved · Wolves to Feed Publishing"
const COPYRIGHT = 'RV MasterPlan\u2122 \u00A9 2026 All Rights Reserved \u00B7 Wolves to Feed Publishing'

interface PageFooterProps {
  deptLabel: string
  pageLabel?: string
}

export function PageFooter({ deptLabel, pageLabel }: PageFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.copyright}>{COPYRIGHT}</Text>
      <Text style={styles.pageLabel}>{deptLabel}{pageLabel ? ` · ${pageLabel}` : ''}</Text>
    </View>
  )
}
