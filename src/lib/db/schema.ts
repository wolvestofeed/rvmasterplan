import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Users & Profiles ---
export const users = pgTable('users', {
    id: text('id').primaryKey(), // Using text to support Clerk/Auth0 IDs
    email: text('email').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull().unique(),
    subscriptionStatus: text('subscription_status').default('inactive'), // 'active', 'inactive', 'admin'
    planType: text('plan_type').default('full'), // 'full', 'starter'
    subscriptionRenewalDate: timestamp('subscription_renewal_date'),
    billingInterval: text('billing_interval'), // 'month', 'year', 'one_time'
    billingAmountCents: integer('billing_amount_cents'), // price in cents (e.g. 1000 = $10.00)
    firstName: text('first_name'),
    lastName: text('last_name'),
    dashboardHeroImage: text('dashboard_hero_image'),
    locationName: text('location_name'),
    locationLat: text('location_lat'),
    locationLon: text('location_lon'),
    stripeCustomerId: text('stripe_customer_id'),
    emailUnsubscribed: boolean('email_unsubscribed').default(false).notNull(),
    emailUnsubscribeToken: text('email_unsubscribe_token').unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- RV Vehicles ---
export const rvVehicles = pgTable('rv_vehicles', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    type: text('type').notNull(), // e.g., 'Travel Trailer', 'Fifth Wheel'
    year: integer('year'),
    make: text('make'),
    model: text('model'),
    lengthFeet: numeric('length_feet'),
    dryWeightLbs: numeric('dry_weight_lbs'),
    gvwrLbs: numeric('gvwr_lbs'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- RV Systems ---
export const powerSystems = pgTable('power_systems', {
    id: text('id').primaryKey(),
    rvId: text('rv_id').references(() => rvVehicles.id).notNull().unique(),
    batteryCapacityAh: numeric('battery_capacity_ah').default('0'),
    batteryVoltage: numeric('battery_voltage').default('12'),
    solarCapacityWatts: numeric('solar_capacity_watts').default('0'),
    inverterWattage: numeric('inverter_wattage').default('0'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const electricalDevices = pgTable('electrical_devices', {
    id: text('id').primaryKey(),
    rvId: text('rv_id').references(() => rvVehicles.id).notNull(),
    name: text('name').notNull(),
    groupType: text('group_type').notNull(), // 'Essential', 'Non-essential'
    category: text('category').notNull(),
    watts: numeric('watts').default('0'),
    hoursPerDay: numeric('hours_per_day').default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const solarEquipment = pgTable('solar_equipment', {
    id: text('id').primaryKey(),
    rvId: text('rv_id').references(() => rvVehicles.id).notNull(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    equipmentType: text('equipment_type').notNull(), // 'Generator', 'Battery', 'Solar Panel', etc.
    specs: text('specs'),
    quantity: integer('quantity').default(1),
    price: numeric('price').default('0'),
    wattage: numeric('wattage').default('0'),
    weight: numeric('weight').default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dailySolarLogs = pgTable('daily_solar_logs', {
    id: text('id').primaryKey(),
    rvId: text('rv_id').references(() => rvVehicles.id).notNull(),
    date: text('date').notNull(),
    weatherCondition: text('weather_condition').notNull(),
    sunHours: numeric('sun_hours').default('0'),
    generatedWh: numeric('generated_wh').default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const waterSystems = pgTable('water_systems', {
    id: text('id').primaryKey(),
    rvId: text('rv_id').references(() => rvVehicles.id).notNull().unique(),
    freshCapacityGal: numeric('fresh_capacity_gal').default('0'),
    grayCapacityGal: numeric('gray_capacity_gal').default('0'),
    blackCapacityGal: numeric('black_capacity_gal').default('0'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Equipment, Setup & Purchases ---
export const equipmentItems = pgTable('equipment_items', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    category: text('category'), // 'Energy', 'Towing', 'Water', etc.
    priority: text('priority'), // 'Must Have', 'Nice to Have', 'Future Upgrade'
    cost: numeric('cost').default('0'),
    weight: numeric('weight').default('0'),
    isAcquired: boolean('is_acquired').default(false),
    purchaseDeadline: timestamp('purchase_deadline'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Documents ---
export const documents = pgTable('documents', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    title: text('title').notNull(),
    fileType: text('file_type').notNull(), // 'pdf', 'image'
    fileUrl: text('file_url'),
    renewalDate: timestamp('renewal_date'),
    renewalCost: numeric('renewal_cost'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Activity & Events ---
export const eventsAndLogs = pgTable('events_and_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    eventType: text('event_type').notNull(), // 'Tank Dump', 'Maintenance', 'Reminder', 'Note'
    title: text('title').notNull(), // e.g. "Tire Pressure Inspection"
    status: text('status').default('Upcoming'), // 'Upcoming', 'Completed', 'Canceled'
    scheduledDate: timestamp('scheduled_date'),
    tags: jsonb('tags'), // e.g., ["Black Tank", "Flush"]
    metrics: jsonb('metrics'), // e.g., { "volume": 40, "cost": 15.00 }
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Budget: Incomes & Expenses ---
export const incomes = pgTable('incomes', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    source: text('source').notNull(),
    amount: numeric('amount').default('0'),
    isFixed: boolean('is_fixed').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    category: text('category'),
    amount: numeric('amount').default('0'),
    month: integer('month'),
    year: integer('year'),
    isFixed: boolean('is_fixed').default(false),
    isFuelEvent: boolean('is_fuel_event').default(false),
    isPropaneEvent: boolean('is_propane_event').default(false),
    gallons: numeric('gallons'),
    odometerReading: integer('odometer_reading'),
    isHitched: boolean('is_hitched').default(false),
    stateLocation: text('state_location'),
    receiptUrl: text('receipt_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const targetBudgets = pgTable('target_budgets', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    amount: numeric('amount').default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Purchase Financials ---
export const financialData = pgTable('financial_data', {
    id: text('id').primaryKey(),
    rvId: text('rv_id').references(() => rvVehicles.id).notNull().unique(),
    purchasePrice: numeric('purchase_price').default('0'),
    salesTaxRate: numeric('sales_tax_rate').default('0'),
    downPayment: numeric('down_payment').default('0'),
    tradeInValue: numeric('trade_in_value').default('0'),
    loanTermYears: integer('loan_term_years').default(5),
    interestRate: numeric('interest_rate').default('0'),
    creditScore: text('credit_score'),
    registrationFees: numeric('registration_fees').default('0'),
    insurance: numeric('insurance').default('0'),
    extendedWarranty: numeric('extended_warranty').default('0'),
    accessories: numeric('accessories').default('0'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Water Activities & Tank Logs ---
export const waterActivities = pgTable('water_activities', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    gallonsPerUse: numeric('gallons_per_use').default('0'),
    timesPerDay: numeric('times_per_day').default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tankLogs = pgTable('tank_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    date: text('date').notNull(),
    type: text('type').notNull(),
    tank: text('tank').notNull(),
    volume: numeric('volume').default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---
export const usersRelations = relations(users, ({ one, many }) => ({
    profile: one(userProfiles, {
        fields: [users.id],
        references: [userProfiles.userId],
    }),
    rvs: many(rvVehicles),
    equipment: many(equipmentItems),
    documents: many(documents),
    eventsAndLogs: many(eventsAndLogs)
}));

export const rvVehiclesRelations = relations(rvVehicles, ({ one, many }) => ({
    user: one(users, {
        fields: [rvVehicles.userId],
        references: [users.id],
    }),
    powerSystem: one(powerSystems, {
        fields: [rvVehicles.id],
        references: [powerSystems.rvId]
    }),
    waterSystem: one(waterSystems, {
        fields: [rvVehicles.id],
        references: [waterSystems.rvId]
    }),
    financials: one(financialData, {
        fields: [rvVehicles.id],
        references: [financialData.rvId]
    }),
    electricalDevices: many(electricalDevices),
    solarEquipment: many(solarEquipment),
    solarLogs: many(dailySolarLogs)
}));

// --- Cash Flow Statement ---
// A scenario is one 12-month cash-flow statement (one spreadsheet tab).
export const cfScenarios = pgTable('cf_scenarios', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    year: integer('year').notNull(),
    openingCash: numeric('opening_cash').default('0').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    clonedFromId: text('cloned_from_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [index('cf_scenarios_user_idx').on(t.userId)]);

// Sections group line items: receipts (cash in) or outflow (cash out).
export const cfSections = pgTable('cf_sections', {
    id: text('id').primaryKey(),
    scenarioId: text('scenario_id').references(() => cfScenarios.id, { onDelete: 'cascade' }).notNull(),
    kind: text('kind').notNull(), // 'receipts' | 'outflow'
    name: text('name').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
}, (t) => [index('cf_sections_scenario_idx').on(t.scenarioId)]);

export const cfLineItems = pgTable('cf_line_items', {
    id: text('id').primaryKey(),
    scenarioId: text('scenario_id').references(() => cfScenarios.id, { onDelete: 'cascade' }).notNull(),
    sectionId: text('section_id').references(() => cfSections.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    category: text('category').default('Other').notNull(),
    dueDay: integer('due_day'), // 1-31, null = no fixed due day
    recurrence: text('recurrence').default('monthly').notNull(), // 'monthly' | 'annual' | 'seasonal' | 'calculated'
    sortOrder: integer('sort_order').default(0).notNull(),
    archived: boolean('archived').default(false).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [index('cf_line_items_scenario_idx').on(t.scenarioId)]);

// One cell per line item per month (0 = January).
export const cfCells = pgTable('cf_cells', {
    id: text('id').primaryKey(),
    scenarioId: text('scenario_id').references(() => cfScenarios.id, { onDelete: 'cascade' }).notNull(),
    lineItemId: text('line_item_id').references(() => cfLineItems.id, { onDelete: 'cascade' }).notNull(),
    month: integer('month').notNull(),
    planned: numeric('planned').default('0').notNull(),
    actual: numeric('actual'), // Phase 2: Plan vs Actual
    paid: boolean('paid').default(false).notNull(),
    note: text('note'),
}, (t) => [
    uniqueIndex('cf_cells_line_month_idx').on(t.lineItemId, t.month),
    index('cf_cells_scenario_idx').on(t.scenarioId),
]);

// Calculators (paycheck, purchase, energy) that write into a line item.
export const cfCalculators = pgTable('cf_calculators', {
    id: text('id').primaryKey(),
    scenarioId: text('scenario_id').references(() => cfScenarios.id, { onDelete: 'cascade' }).notNull(),
    lineItemId: text('line_item_id').references(() => cfLineItems.id, { onDelete: 'set null' }),
    type: text('type').notNull(), // 'paycheck' | 'purchase' | 'energy'
    name: text('name').notNull(),
    params: jsonb('params').$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [index('cf_calculators_scenario_idx').on(t.scenarioId)]);

export const cfScenariosRelations = relations(cfScenarios, ({ one, many }) => ({
    user: one(users, { fields: [cfScenarios.userId], references: [users.id] }),
    sections: many(cfSections),
    lineItems: many(cfLineItems),
    cells: many(cfCells),
    calculators: many(cfCalculators),
}));
export const cfSectionsRelations = relations(cfSections, ({ one, many }) => ({
    scenario: one(cfScenarios, { fields: [cfSections.scenarioId], references: [cfScenarios.id] }),
    lineItems: many(cfLineItems),
}));
export const cfLineItemsRelations = relations(cfLineItems, ({ one, many }) => ({
    scenario: one(cfScenarios, { fields: [cfLineItems.scenarioId], references: [cfScenarios.id] }),
    section: one(cfSections, { fields: [cfLineItems.sectionId], references: [cfSections.id] }),
    cells: many(cfCells),
}));
export const cfCellsRelations = relations(cfCells, ({ one }) => ({
    lineItem: one(cfLineItems, { fields: [cfCells.lineItemId], references: [cfLineItems.id] }),
}));

// --- Settings ---
export const systemSettings = pgTable('system_settings', {
    id: text('id').primaryKey(), // e.g. 'global'
    demoMode: boolean('demo_mode').default(true),
    maintenanceMode: boolean('maintenance_mode').default(false),
    defaultSubDays: integer('default_sub_days').default(30),
    featureFlags: jsonb('feature_flags').$type<Record<string, boolean>>().default({
        "solar_capture": true,
        "document_manager": true,
        "water_calculator": true,
        "budget_calculator": true,
        "purchase_calculator": true,
        "cash_flow": true
    }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
