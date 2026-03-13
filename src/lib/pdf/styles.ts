import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  primary: '#50889c',
  primaryDark: '#3a6b7c',
  primaryLight: '#e8f4f7',
  sage: '#f8fbf5',
  sidebarSage: '#f1f6ea',
  sageLight: '#eef4e8',
  slateText: '#334155',
  slateMid: '#64748b',
  slateLight: '#94a3b8',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  green: '#16a34a',
  greenLight: '#dcfce7',
  purple: '#7c3aed',
  purpleLight: '#ede9fe',
  red: '#dc2626',
  redLight: '#fee2e2',
  cyan: '#0891b2',
  cyanLight: '#cffafe',
  orange: '#ea580c',
  orangeLight: '#ffedd5',
  border: '#e2e8f0',
  borderMid: '#cbd5e1',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.37)',
}

export const fonts = {
  sizeXs: 7,
  sizeSm: 8.5,
  sizeBase: 10,
  sizeMd: 12,
  sizeLg: 15,
  sizeXl: 20,
  size2xl: 28,
  size3xl: 38,
}

export const shared = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    paddingTop: 36,
    paddingBottom: 54,
  },
  headerPage: {
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
    paddingTop: 0,
    paddingBottom: 54,
  },
  contentArea: {
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flexDirection: 'column',
  },
  // Footer
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
  footerText: {
    fontSize: fonts.sizeXs,
    color: colors.slateLight,
  },
})
