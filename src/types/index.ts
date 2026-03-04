export interface FinancialData {
    purchasePrice: number;
    salesTaxRate: number;
    downPayment: number;
    tradeInValue: number;
    loanTerm: number;
    interestRate: number;
    creditScore: string;
    registrationFees: number;
    insurance: number;
    extendedWarranty: number;
    accessories: number;
}

export interface FinancialSummary {
    amountToFinance: number;
    monthlyPayment: number;
    totalInterest: number;
    totalLoanCost: number;
    totalInvestment: number;
}

export interface WaterActivity {
    id: string;
    name: string;
    category: string;
    gallonsPerUse: number;
    timesPerDay: number;
    isEssential?: boolean;
    unitType?: 'gallons' | 'ounces';
}

export interface WaterData {
    freshWaterCapacity: number;
    freshWaterLevel: number;
    grayWaterCapacity: number;
    grayWaterLevel: number;
    blackWaterCapacity: number;
    blackWaterLevel: number;
    lastFillDate: string | null;
    conservationSetup?: string[];
}

export interface WaterSummary {
    dailyUsage: number;
    daysUntilEmpty: number;
    weeklyUsage: number;
    monthlyUsage: number;
    percentWaterRemaining: number;
}

export type SetupItemCategory =
    | 'ENERGY'
    | 'TOWING'
    | 'BRAKES'
    | 'WATER'
    | 'STORAGE'
    | 'RENOVATIONS'
    | 'SECURITY'
    | 'OTHER';

export type SetupItemPriority = 'Must Have' | 'Nice to Have' | 'Future Upgrade';

export interface SetupItem {
    id: string;
    name: string;
    category: SetupItemCategory;
    cost: number;
    priority: SetupItemPriority;
    acquired: boolean;
    purchaseDeadline?: Date | null;
    notes?: string;
    weight?: number;
    make?: string;
    model?: string;
    quantity?: number;
}

export type DeviceGroup = 'Essential' | 'Non-essential';
export type DeviceCategory =
    | 'Refrigeration' | 'Plumbing' | 'Lighting' | 'IT/Comms' | 'Climate Control'
    | 'Kitchen' | 'Personal Care' | 'Recreation' | 'Work';

export interface ElectricalDevice {
    id: string;
    name: string;
    group: DeviceGroup;
    category: DeviceCategory;
    watts: number;
    hoursPerDay: number;
}

export interface EnergyData {
    sunHours: number;
    avgWattsPerHour: number;
    useLogAvgWatts: boolean;
    batteryCapacity: number;
    batteryVoltage: number;
    solarArray: number;
}

export interface SolarPanel {
    id: string;
    make: string;
    model: string;
    wattage: number;
    quantity: number;
    efficiency: number;
    type: string;
    cellType: string;
    weight: number;
}

export interface SolarBattery {
    id: string;
    make: string;
    model: string;
    capacityWh: number;
    capacityAh: number;
    ampHours: number;
    voltage: string;
    cycles: number;
    weight: number;
    type: string;
    rechargeTime120V: number;
    rechargeTime30Amp: number;
    rechargeSolar: number;
    daisyChainCapable: boolean;
    dimensions: string;
    lifespan: number;
    warranty: number;
    quantity: number;
}

export interface SolarGenerator {
    id: string;
    make: string;
    model: string;
    outputWatts: number;
    batteryCapacityWh: number;
    systemType: string;
    chargeControllerType: string;
    rechargeTime120V: number;
    rechargeTimeSolar: number;
    has12VOutput: boolean;
    has30AmpOutput: boolean;
    acOutlets: number;
    usbPorts: number;
    dcPorts: number;
    weight: number;
    quantity: number;
}

export interface SolarInverter {
    id: string;
    make: string;
    model: string;
    continuousWatts: number;
    surgeWatts: number;
    voltageIn: string;
    voltageOut: string;
    type: string; // e.g., 'Pure Sine Wave'
    quantity: number;
}

export type GenericSolarEquipmentType = 'Generator' | 'Battery' | 'Solar Panel' | 'Inverter' | 'Charge Controller' | 'Battery Monitor' | 'DC Alternator Charger' | 'Surge Protector' | 'Other';

export interface GenericSolarEquipment {
    id: string;
    make: string;
    model: string;
    equipmentType: GenericSolarEquipmentType;
    specs?: string;
    quantity: number;
    price: number;
    wattage?: number; // Watts per hour — relevant for Solar Panels, Batteries, Generators
    weight?: number; // Weight in lbs
}

export type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Overcast' | 'Bad Weather';

export interface DailySolarLog {
    id: string;
    date: string; // ISO date string e.g. '2026-03-03'
    weatherCondition: WeatherCondition;
    sunHours: number;
    generatedWh: number; // Actual Wh generated, manually entered by user
}

export type ExpenseGroup = 'Essential' | 'Non-essential';
export type ExpenseCategory =
    | 'Campground' | 'Water' | 'Propane' | 'Food' | 'Personal Supplies'
    | 'RV Supplies' | 'Legal' | 'Financial' | 'Recreation' | 'Work'
    | 'Maintenance' | 'Other';

export interface ExpenseItem {
    id: string;
    name: string;
    group: ExpenseGroup;
    category: ExpenseCategory;
    costPerItem: number;
    quantity: number;
    tax: number;
    month: number;
    year: number;
}

export interface MonthlyBudget {
    id?: string;
    month: number;
    year: number;
    budgetedAmount: number;
}
