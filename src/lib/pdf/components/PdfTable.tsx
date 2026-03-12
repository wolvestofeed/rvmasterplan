import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fonts } from '../styles'

const styles = StyleSheet.create({
  tableContainer: {
    paddingHorizontal: 30,
    marginTop: 6,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerCell: {
    color: colors.white,
    fontSize: fonts.sizeXs,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  rowAlt: {
    backgroundColor: colors.sage,
  },
  cell: {
    fontSize: fonts.sizeSm,
    color: colors.slateText,
    fontFamily: 'Helvetica',
  },
  emptyText: {
    paddingHorizontal: 30,
    fontSize: fonts.sizeSm,
    color: colors.slateMid,
    fontFamily: 'Helvetica-Oblique',
    marginTop: 8,
  },
})

export interface TableColumn {
  header: string
  key: string
  flex?: number
  align?: 'left' | 'right' | 'center'
  color?: string
  bold?: boolean
}

interface PdfTableProps {
  columns: TableColumn[]
  rows: Record<string, string | number>[]
  emptyMessage?: string
}

export function PdfTable({ columns, rows, emptyMessage = 'No data available.' }: PdfTableProps) {
  if (rows.length === 0) {
    return <Text style={styles.emptyText}>{emptyMessage}</Text>
  }

  return (
    <View style={styles.tableContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        {columns.map((col) => (
          <Text
            key={col.key}
            style={[
              styles.headerCell,
              { flex: col.flex ?? 1, textAlign: col.align ?? 'left' },
            ]}
          >
            {col.header}
          </Text>
        ))}
      </View>

      {/* Rows */}
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[
                styles.cell,
                {
                  flex: col.flex ?? 1,
                  textAlign: col.align ?? 'left',
                  color: col.color ?? colors.slateText,
                  fontFamily: col.bold ? 'Helvetica-Bold' : 'Helvetica',
                },
              ]}
            >
              {String(row[col.key] ?? '')}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}
