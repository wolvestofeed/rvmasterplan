import React from 'react'
import { Document } from '@react-pdf/renderer'

import { MasterCover } from '../MasterCover'

import { DashboardPages } from './DashboardReport'
import type { RVVehicle, UserProfile, DashboardEvent } from './DashboardReport'

import { PurchaseCalcPages } from './PurchaseCalcReport'
import type { FinancialData, RVData } from './PurchaseCalcReport'

import { SetupBudgetPages } from './SetupBudgetReport'
import type { SetupItem } from './SetupBudgetReport'

import { LivingBudgetPages } from './LivingBudgetReport'
import type { ExpenseItem, MonthlyBudget } from './LivingBudgetReport'

import { FuelEconomyPages } from './FuelEconomyReport'
import type { FuelEntry } from './FuelEconomyReport'

import { PowerSolarPages } from './PowerSolarReport'

import { WaterPages } from './WaterReport'
import type { WaterSystem, WaterActivity, TankLog } from './WaterReport'

import { DocumentsPages } from './DocumentsReport'
import type { DocumentItem } from './DocumentsReport'

// Re-export types for convenience
export type { RVVehicle, UserProfile, DashboardEvent }
export type { FinancialData, RVData }
export type { SetupItem }
export type { ExpenseItem, MonthlyBudget }
export type { FuelEntry }
export type { WaterSystem, WaterActivity, TankLog }
export type { DocumentItem }

// Import device types from PowerSolarReport
import type { ElectricalDevice, SolarEquipmentItem } from './PowerSolarReport'
export type { ElectricalDevice, SolarEquipmentItem }

export interface MasterPlanReportProps {
  // Cover page
  userName?: string
  rvLabel?: string

  // Dashboard
  rv?: RVVehicle | null
  profile?: UserProfile | null
  events?: DashboardEvent[]

  // Purchase Calculator
  financials?: FinancialData | null

  // Setup Budget
  setupItems?: SetupItem[]

  // Living Budget
  expenses?: ExpenseItem[]
  budgets?: MonthlyBudget[]
  budgetYear?: number

  // Fuel Economy
  fuelEntries?: FuelEntry[]
  fuelYear?: number

  // Power & Solar
  devices?: ElectricalDevice[]
  solarEquipment?: SolarEquipmentItem[]

  // Water Management
  waterSystem?: WaterSystem
  waterActivities?: WaterActivity[]
  tankLogs?: TankLog[]

  // Documents & Renewals
  documents?: DocumentItem[]
}

export function MasterPlanReport({
  userName,
  rvLabel,
  rv,
  profile,
  events = [],
  financials,
  setupItems = [],
  expenses = [],
  budgets = [],
  budgetYear,
  fuelEntries = [],
  fuelYear,
  devices = [],
  solarEquipment = [],
  waterSystem = { freshWaterCapacity: 0, grayWaterCapacity: 0, blackWaterCapacity: 0 },
  waterActivities = [],
  tankLogs = [],
  documents = [],
}: MasterPlanReportProps) {
  return (
    <Document>
      {/* Cover Page */}
      <MasterCover userName={userName} rvLabel={rvLabel} />

      {/* 1. Dashboard Overview */}
      <DashboardPages rv={rv} profile={profile} events={events} />

      {/* 2. RV Purchase Calculator */}
      <PurchaseCalcPages financials={financials} rv={rv} />

      {/* 3. RV Setup Budget */}
      <SetupBudgetPages items={setupItems} />

      {/* 4. RV Living Budget */}
      <LivingBudgetPages expenses={expenses} budgets={budgets} year={budgetYear} />

      {/* 5. Fuel Economy */}
      <FuelEconomyPages fuelEntries={fuelEntries} year={fuelYear} />

      {/* 6. Power & Solar Strategy */}
      <PowerSolarPages devices={devices} solarEquipment={solarEquipment} />

      {/* 7. Water Management */}
      <WaterPages waterSystem={waterSystem} activities={waterActivities} tankLogs={tankLogs} />

      {/* 8. Documents & Renewals */}
      <DocumentsPages documents={documents} />
    </Document>
  )
}
