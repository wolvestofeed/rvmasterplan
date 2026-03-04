import { pgTable, text, timestamp, boolean, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
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
    subscriptionRenewalDate: timestamp('subscription_renewal_date'),
    firstName: text('first_name'),
    lastName: text('last_name'),
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

export const rvVehiclesRelations = relations(rvVehicles, ({ one }) => ({
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
    })
}));
