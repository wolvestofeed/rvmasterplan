import { WaterData, WaterActivity, SetupItem } from '@/types';

export const mockRVDetails = {
    type: 'Travel Trailer',
    year: 2026,
    make: 'Dutchmen',
    model: 'Aspen Trail LE 21RD',
    length: 21,
    weight: 3600,
    purchaseDate: '2024-05-01',
    purchasePrice: 23644.36,
    freshWaterCapacity: 52,
    greyWaterCapacity: 42,
    blackWaterCapacity: 42,
    propaneCapacity: 40,
    batteryCapacity: 100
};

export const mockFinancialData = {
    purchasePrice: 23644.36,
    salesTaxRate: 8.25,
    downPayment: 4000,
    tradeInValue: 0,
    loanTerm: 10,
    interestRate: 8.89,
    creditScore: 'Excellent (720+)',
    registrationFees: 535.15,
    insurance: 705,
    extendedWarranty: 2926,
    accessories: 3000
};

export const mockDevices = [
    { id: '1', name: '12V 10.7 CU FT Refrigerator & Freezer', group: 'Essential', category: 'Refrigeration', watts: 85, hoursPerDay: 12 },
    { id: '2', name: 'Space Heater', group: 'Essential', category: 'Climate Control', watts: 750, hoursPerDay: 0 },
    { id: '3', name: 'Water Pump', group: 'Essential', category: 'Plumbing', watts: 100, hoursPerDay: 0.33 },
    { id: '4', name: 'Microwave', group: 'Non-essential', category: 'Kitchen', watts: 800, hoursPerDay: 0.1 },
    { id: '5', name: 'Laptop', group: 'Non-essential', category: 'Work', watts: 45, hoursPerDay: 3 },
    { id: '6', name: 'iPad', group: 'Non-essential', category: 'Recreation', watts: 12, hoursPerDay: 2 },
    { id: '7', name: 'Phone', group: 'Essential', category: 'IT/Comms', watts: 5, hoursPerDay: 2 },
    { id: '8', name: 'RV LEDs', group: 'Essential', category: 'Lighting', watts: 20, hoursPerDay: 4 },
    { id: '9', name: 'Hood Light', group: 'Essential', category: 'Lighting', watts: 5, hoursPerDay: 1 },
    { id: '10', name: '13.5K BTU HE Furrion Chill AC', group: 'Non-essential', category: 'Climate Control', watts: 1200, hoursPerDay: 0 },
    { id: '11', name: 'Shaver', group: 'Non-essential', category: 'Personal Care', watts: 15, hoursPerDay: 0.1 },
    { id: '12', name: 'Audio Speakers', group: 'Non-essential', category: 'Recreation', watts: 30, hoursPerDay: 2 },
    { id: '13', name: 'Toothbrush', group: 'Essential', category: 'Personal Care', watts: 5, hoursPerDay: 0.1 },
    { id: '14', name: 'Ninja Blenders', group: 'Non-essential', category: 'Kitchen', watts: 900, hoursPerDay: 0.1 },
    { id: '15', name: 'Charging Mini Portable Power Banks', group: 'Essential', category: 'Work', watts: 10, hoursPerDay: 2 },
    { id: '16', name: 'Flashlight', group: 'Essential', category: 'Lighting', watts: 3, hoursPerDay: 0.5 },
    { id: '17', name: 'Lanterns', group: 'Essential', category: 'Lighting', watts: 5, hoursPerDay: 1 }
];

export const mockEnergyData = {
    sunHours: 5,
    avgWattsPerHour: 200,
    useLogAvgWatts: true,
    batteryCapacity: 10800,
    batteryVoltage: 12,
    solarArray: 800
};

export const mockSolarPanels = [
    { id: '1', make: 'EcoFlow', model: 'PV400', wattage: 400, quantity: 2, efficiency: 23, type: 'flexible', cellType: 'Monocrystalline', weight: 12.5 }
];

export const mockSolarBatteries = [
    { id: '1', make: 'EcoFlow', model: 'Smart Extra Battery', capacityWh: 3600, capacityAh: 300, ampHours: 300, voltage: '12V', cycles: 3500, weight: 84, type: 'LFP', rechargeTime120V: 2.7, rechargeTime30Amp: 1.8, rechargeSolar: 4.5, daisyChainCapable: true, dimensions: '25.0 × 10.6 × 10.8 in', lifespan: 10, warranty: 5, quantity: 1 },
    { id: '2', make: 'EcoFlow', model: 'DELTA Pro Battery', capacityWh: 3600, capacityAh: 300, ampHours: 300, voltage: '12V', cycles: 3500, weight: 84, type: 'LFP', rechargeTime120V: 2.7, rechargeTime30Amp: 1.8, rechargeSolar: 4.5, daisyChainCapable: true, dimensions: '25.0 × 10.6 × 10.8 in', lifespan: 10, warranty: 5, quantity: 1 }
];

export const mockSolarGenerators = [
    { id: '1', make: 'EcoFlow', model: 'DELTA Pro', outputWatts: 3600, batteryCapacityWh: 3600, systemType: 'generator', chargeControllerType: 'MPPT', rechargeTime120V: 2.7, rechargeTimeSolar: 4.5, has12VOutput: true, has30AmpOutput: true, acOutlets: 5, usbPorts: 6, dcPorts: 2, weight: 99, quantity: 1 },
    { id: '2', make: 'EcoFlow', model: 'DELTA Pro', outputWatts: 3600, batteryCapacityWh: 3600, systemType: 'generator', chargeControllerType: 'MPPT', rechargeTime120V: 2.7, rechargeTimeSolar: 4.5, has12VOutput: true, has30AmpOutput: true, acOutlets: 5, usbPorts: 6, dcPorts: 2, weight: 99, quantity: 1 }
];

export const mockWaterData: WaterData = {
    freshWaterCapacity: 52,
    freshWaterLevel: 100,
    grayWaterCapacity: 42,
    grayWaterLevel: 0,
    blackWaterCapacity: 42,
    blackWaterLevel: 0,
    conservationSetup: [],
    lastFillDate: null,
};

export const mockWaterActivities: WaterActivity[] = [
    { id: '1', name: 'Washing Dishes', category: 'Kitchen', gallonsPerUse: 2.5, timesPerDay: 2, isEssential: true, unitType: 'gallons' },
    { id: '2', name: 'Shower', category: 'Bathroom', gallonsPerUse: 5.0, timesPerDay: 1, isEssential: true, unitType: 'gallons' },
    { id: '3', name: 'Toilet Flush', category: 'Bathroom', gallonsPerUse: 1.0, timesPerDay: 4, isEssential: true, unitType: 'gallons' },
    { id: '4', name: 'Brushing Teeth', category: 'Bathroom', gallonsPerUse: 0.5, timesPerDay: 2, isEssential: true, unitType: 'gallons' },
    { id: '5', name: 'Drinking Water', category: 'Drinking', gallonsPerUse: 0.5, timesPerDay: 1, isEssential: true, unitType: 'gallons' }
];

export const mockSetupItems: SetupItem[] = [
    { id: '1', name: 'Weight Distribution / Sway Control Kit', category: 'TOWING', cost: 649.99, priority: 'Must Have', acquired: true, weight: 75.5, notes: 'e2 Hitch Round Bar' },
    { id: '2', name: 'Leveling Plates (Sets of ten)', category: 'TOWING', cost: 39.99, priority: 'Must Have', acquired: true, weight: 15.0 },
    { id: '3', name: 'Chocks', category: 'TOWING', cost: 24.99, priority: 'Must Have', acquired: true, weight: 8.0 },
    { id: '4', name: 'Brake Control Kit', category: 'BRAKES', cost: 349.99, priority: 'Must Have', acquired: true, weight: 5.2 },
    { id: '5', name: 'Water Storage Bladder', category: 'WATER', cost: 129.99, priority: 'Must Have', acquired: false, weight: 12.5 },
    { id: '6', name: '20V Battery Transfer Water Pump', category: 'WATER', cost: 89.99, priority: 'Must Have', acquired: false, weight: 6.8 },
    { id: '7', name: 'EcoFlow DELTA Pro Solar Generator (PV400W)', category: 'ENERGY', cost: 1799.99, priority: 'Must Have', acquired: false, weight: 99.2 },
    { id: '8', name: 'Extra Battery', category: 'ENERGY', cost: 899.99, priority: 'Nice to Have', acquired: false, weight: 45.0 }
];

// Combine all mock data into a single user profile export
export const mockDemoUser = {
    id: "demo_user_123",
    firstName: "Robert",
    lastName: "Bogatin",
    email: "demo@wolvesfeed.com",
    data: {
        rvDetails: mockRVDetails,
        financial: mockFinancialData,
        devices: mockDevices,
        energy: mockEnergyData,
        solarPanels: mockSolarPanels,
        solarBatteries: mockSolarBatteries,
        solarGenerators: mockSolarGenerators,
        water: mockWaterData
    }
};
