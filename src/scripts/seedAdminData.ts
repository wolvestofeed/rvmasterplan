import { db } from "../lib/db";
import {
    users,
    userProfiles,
    documents,
    rvVehicles,
    powerSystems,
    electricalDevices,
    solarEquipment,
    dailySolarLogs,
    waterSystems,
    waterActivities,
    tankLogs,
    equipmentItems,
    expenses,
    incomes,
    financialData
} from "../lib/db/schema";
import {
    mockDemoUser,
    mockSetupItems
} from "../data/mockData";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function main() {
    const ADMIN_ID = "admin_robert";
    console.log(`Starting comprehensive seed for Admin User: ${ADMIN_ID}`);

    // Ensure user exists
    let adminUser = await db.query.users.findFirst({
        where: eq(users.id, ADMIN_ID)
    });

    if (!adminUser) {
        console.log("Creating Admin User record...");
        await db.insert(users).values({
            id: ADMIN_ID,
            email: "rob@wolvesfeed.com",
            createdAt: new Date()
        });
    }

    // Ensure Profile
    let adminProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ADMIN_ID)
    });

    if (!adminProfile) {
        console.log("Creating Admin Profile...");
        await db.insert(userProfiles).values({
            id: uuidv4(),
            userId: ADMIN_ID,
            subscriptionStatus: "admin",
            planType: "full",
            firstName: "Rob",
            lastName: "Admin"
        });
    }

    // Ensure RV
    let rv = await db.query.rvVehicles.findFirst({
        where: eq(rvVehicles.userId, ADMIN_ID)
    });

    if (!rv) {
        console.log("Creating Admin RV Vehicle...");
        const newRvId = uuidv4();
        await db.insert(rvVehicles).values({
            id: newRvId,
            userId: ADMIN_ID,
            type: mockDemoUser.data.rvDetails.type,
            year: mockDemoUser.data.rvDetails.year,
            make: mockDemoUser.data.rvDetails.make,
            model: mockDemoUser.data.rvDetails.model,
            lengthFeet: mockDemoUser.data.rvDetails.length.toString(),
            dryWeightLbs: mockDemoUser.data.rvDetails.weight.toString()
        });
        rv = { id: newRvId, userId: ADMIN_ID, type: '', createdAt: new Date(), updatedAt: new Date(), year: null, make: null, model: null, lengthFeet: null, dryWeightLbs: null, gvwrLbs: null, imageUrl: null };
    }

    const RV_ID = rv.id;

    // Financial Data
    const existingFinancial = await db.query.financialData.findFirst({
        where: eq(financialData.rvId, RV_ID)
    });

    if (!existingFinancial) {
        console.log("Creating Financial Data...");
        await db.insert(financialData).values({
            id: uuidv4(),
            rvId: RV_ID,
            purchasePrice: mockDemoUser.data.financial.purchasePrice.toString(),
            salesTaxRate: mockDemoUser.data.financial.salesTaxRate.toString(),
            downPayment: mockDemoUser.data.financial.downPayment.toString(),
            loanTermYears: mockDemoUser.data.financial.loanTerm,
            interestRate: mockDemoUser.data.financial.interestRate.toString(),
            registrationFees: mockDemoUser.data.financial.registrationFees.toString(),
            insurance: mockDemoUser.data.financial.insurance.toString(),
            extendedWarranty: mockDemoUser.data.financial.extendedWarranty.toString(),
            accessories: mockDemoUser.data.financial.accessories.toString()
        });
    }

    // Power Systems
    const existingPower = await db.query.powerSystems.findFirst({
        where: eq(powerSystems.rvId, RV_ID)
    });

    if (!existingPower) {
        console.log("Creating Power System...");
        await db.insert(powerSystems).values({
            id: uuidv4(),
            rvId: RV_ID,
            batteryCapacityAh: (mockDemoUser.data.energy.batteryCapacity / mockDemoUser.data.energy.batteryVoltage).toString(),
            batteryVoltage: mockDemoUser.data.energy.batteryVoltage.toString(),
            solarCapacityWatts: mockDemoUser.data.energy.solarArray.toString()
        });
    }

    // Water Systems
    const existingWater = await db.query.waterSystems.findFirst({
        where: eq(waterSystems.rvId, RV_ID)
    });

    if (!existingWater) {
        console.log("Creating Water System...");
        await db.insert(waterSystems).values({
            id: uuidv4(),
            rvId: RV_ID,
            freshCapacityGal: mockDemoUser.data.water.freshWaterCapacity.toString(),
            grayCapacityGal: mockDemoUser.data.water.grayWaterCapacity.toString(),
            blackCapacityGal: mockDemoUser.data.water.blackWaterCapacity.toString()
        });
    }

    // Clear and re-seed 1-to-many lists
    console.log("Clearing existing devices, logs, equipment...");
    await db.delete(electricalDevices).where(eq(electricalDevices.rvId, RV_ID));
    await db.delete(solarEquipment).where(eq(solarEquipment.rvId, RV_ID));
    await db.delete(dailySolarLogs).where(eq(dailySolarLogs.rvId, RV_ID));
    await db.delete(waterActivities).where(eq(waterActivities.userId, ADMIN_ID));
    await db.delete(equipmentItems).where(eq(equipmentItems.userId, ADMIN_ID));

    console.log("Inserting Devices...");
    for (const d of mockDemoUser.data.devices) {
        await db.insert(electricalDevices).values({
            id: uuidv4(),
            rvId: RV_ID,
            name: d.name,
            groupType: d.group,
            category: d.category,
            watts: d.watts.toString(),
            hoursPerDay: d.hoursPerDay.toString()
        });
    }

    console.log("Inserting Solar Equipment...");
    for (const sq of mockDemoUser.data.genericSolarEquipment) {
        await db.insert(solarEquipment).values({
            id: uuidv4(),
            rvId: RV_ID,
            make: sq.make,
            model: sq.model,
            equipmentType: sq.equipmentType,
            specs: sq.specs,
            quantity: sq.quantity,
            price: sq.price.toString(),
            wattage: sq.wattage?.toString(),
            weight: sq.weight?.toString()
        });
    }

    console.log("Inserting Solar Logs...");
    for (const log of mockDemoUser.data.dailySolarLogs) {
        await db.insert(dailySolarLogs).values({
            id: uuidv4(),
            rvId: RV_ID,
            date: log.date,
            weatherCondition: log.weatherCondition,
            sunHours: log.sunHours.toString(),
            generatedWh: log.generatedWh.toString()
        });
    }

    console.log("Inserting Water Activities...");
    const { mockWaterActivities } = await import('../data/mockData');
    for (const w of mockWaterActivities) {
        await db.insert(waterActivities).values({
            id: uuidv4(),
            userId: ADMIN_ID,
            name: w.name,
            category: w.category,
            gallonsPerUse: w.gallonsPerUse.toString(),
            timesPerDay: w.timesPerDay.toString()
        });
    }

    console.log("Inserting Mock Documents...");
    const mockDocs = [
        { title: "2026 Registration", type: "pdf" },
        { title: "Progressive RV Insurance", type: "pdf" },
        { title: "RV Purchase Agreement", type: "pdf" },
        { title: "State Park Annual Pass", type: "image" }
    ];
    for (const doc of mockDocs) {
        await db.insert(documents).values({
            id: uuidv4(),
            userId: ADMIN_ID,
            title: doc.title,
            fileType: doc.type,
            fileUrl: "",
            createdAt: new Date()
        });
    }
    console.log("Inserting General Equipment Items...");
    for (const item of mockSetupItems) {
        await db.insert(equipmentItems).values({
            id: uuidv4(),
            userId: ADMIN_ID,
            name: item.name,
            category: item.category,
            priority: item.priority || "Nice to Have",
            cost: item.cost.toString(),
            weight: item.weight?.toString() || "0",
            isAcquired: item.acquired,
            notes: item.notes
        });
    }

    console.log("------------- Admin Seed Complete -------------");
    console.log("You can now click 'Publish to Demo Mode' on the frontend to push this new Admin state to the Demo user.");
}

main().catch(console.error);
