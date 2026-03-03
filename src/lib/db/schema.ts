import { pgTable, text, timestamp, boolean, integer, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const equipment = pgTable('equipment', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    category: text('category'),
    cost: numeric('cost'),
    // Setup fields
    isEssential: boolean('is_essential').default(true),
    isPurchased: boolean('is_purchased').default(false),
    // Power fields
    watts: numeric('watts'),
    hoursPerDay: numeric('hours_per_day'),
    runsOnInverter: boolean('runs_on_inverter').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const waterActivities = pgTable('water_activities', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(), // Kitchen, Bathroom, etc.
    gallonsPerUse: numeric('gallons_per_use').notNull(),
    timesPerDay: numeric('times_per_day').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tankLogs = pgTable('tank_logs', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    type: text('type').notNull(), // Dump, Fill
    tank: text('tank').notNull(), // Fresh, Gray, Black
    volume: numeric('volume').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const incomes = pgTable('incomes', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    source: text('source').notNull(),
    amount: numeric('amount').notNull(),
    isFixed: boolean('is_fixed').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    amount: numeric('amount').notNull(),
    isFixed: boolean('is_fixed').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
