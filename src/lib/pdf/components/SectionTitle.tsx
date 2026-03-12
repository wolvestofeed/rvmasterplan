import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fonts } from '../styles'

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    marginTop: 18,
    marginBottom: 8,
  },
  // Wrapper shrinks to text width so border matches text length
  titleWrapper: {
    alignSelf: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 4,
    marginBottom: 3,
  },
  title: {
    fontSize: fonts.sizeMd,
    fontFamily: 'Helvetica-Bold',
    color: colors.slateText,
  },
  ruleLight: {
    height: 0.5,
    backgroundColor: colors.border,
  },
})

interface SectionTitleProps {
  title: string
}

export function SectionTitle({ title }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.ruleLight} />
    </View>
  )
}
