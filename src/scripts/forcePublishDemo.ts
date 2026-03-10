import { db } from "../lib/db";
import {
    documents, equipmentItems, eventsAndLogs, rvVehicles,
    powerSystems, waterSystems, waterActivities, tankLogs, incomes, expenses,
    electricalDevices, solarEquipment, dailySolarLogs, financialData
} from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function forcePublishToDemo() {
    const ADMIN_ID = "admin_robert";
    const DEMO_ID = "demo_user";

    console.log("Starting forced local Publish To Demo mode...");

    try {
        // 1. Delete all existing demo data
        console.log("Clearing existing Demo user data...");
        await db.delete(documents).where(eq(documents.userId, DEMO_ID));
        await db.delete(equipmentItems).where(eq(equipmentItems.userId, DEMO_ID));
        await db.delete(eventsAndLogs).where(eq(eventsAndLogs.userId, DEMO_ID));
        await db.delete(waterActivities).where(eq(waterActivities.userId, DEMO_ID));
        await db.delete(tankLogs).where(eq(tankLogs.userId, DEMO_ID));
        await db.delete(incomes).where(eq(incomes.userId, DEMO_ID));
        await db.delete(expenses).where(eq(expenses.userId, DEMO_ID));

        const existingDemoRV = await db.query.rvVehicles.findFirst({
            where: eq(rvVehicles.userId, DEMO_ID)
        });
        if (existingDemoRV) {
            const rvId = existingDemoRV.id;
            await db.delete(powerSystems).where(eq(powerSystems.rvId, rvId));
            await db.delete(waterSystems).where(eq(waterSystems.rvId, rvId));
            await db.delete(electricalDevices).where(eq(electricalDevices.rvId, rvId));
            await db.delete(solarEquipment).where(eq(solarEquipment.rvId, rvId));
            await db.delete(dailySolarLogs).where(eq(dailySolarLogs.rvId, rvId));
            await db.delete(financialData).where(eq(financialData.rvId, rvId));
            await db.delete(rvVehicles).where(eq(rvVehicles.userId, DEMO_ID));
        }

        // 2. Query all admin base state
        console.log("Loading Admin base models...");
        const adminDocs = await db.query.documents.findMany({ where: eq(documents.userId, ADMIN_ID) });
        const adminEquip = await db.query.equipmentItems.findMany({ where: eq(equipmentItems.userId, ADMIN_ID) });
        const adminEvents = await db.query.eventsAndLogs.findMany({ where: eq(eventsAndLogs.userId, ADMIN_ID) });
        const adminWA = await db.query.waterActivities.findMany({ where: eq(waterActivities.userId, ADMIN_ID) });
        const adminTL = await db.query.tankLogs.findMany({ where: eq(tankLogs.userId, ADMIN_ID) });
        const adminInc = await db.query.incomes.findMany({ where: eq(incomes.userId, ADMIN_ID) });
        const adminExp = await db.query.expenses.findMany({ where: eq(expenses.userId, ADMIN_ID) });
        const adminRV = await db.query.rvVehicles.findFirst({ where: eq(rvVehicles.userId, ADMIN_ID) });

        let powerSys, waterSys, electricDevs, solarEquip, solarLogs, financials;
        if (adminRV) {
            const rvId = adminRV.id;
            powerSys = await db.query.powerSystems.findFirst({ where: eq(powerSystems.rvId, rvId) });
            waterSys = await db.query.waterSystems.findFirst({ where: eq(waterSystems.rvId, rvId) });
            electricDevs = await db.query.electricalDevices.findMany({ where: eq(electricalDevices.rvId, rvId) });
            solarEquip = await db.query.solarEquipment.findMany({ where: eq(solarEquipment.rvId, rvId) });
            solarLogs = await db.query.dailySolarLogs.findMany({ where: eq(dailySolarLogs.rvId, rvId) });
            financials = await db.query.financialData.findFirst({ where: eq(financialData.rvId, rvId) });
        }

        // Helper to clone IDs
        const cloneData = (dataArray: any[]) => {
            return dataArray.map((row) => {
                const { id, createdAt, updatedAt, ...rest } = row as any;
                return {
                    ...rest,
                    id: uuidv4(),
                    userId: DEMO_ID
                };
            });
        };

        // 3. Inserting Data
        console.log("Cloning generic tables...");
        if (adminDocs.length > 0) await db.insert(documents).values(cloneData(adminDocs));
        if (adminEquip.length > 0) await db.insert(equipmentItems).values(cloneData(adminEquip));
        if (adminEvents.length > 0) await db.insert(eventsAndLogs).values(cloneData(adminEvents));
        if (adminWA.length > 0) await db.insert(waterActivities).values(cloneData(adminWA));
        if (adminTL.length > 0) await db.insert(tankLogs).values(cloneData(adminTL));
        if (adminInc.length > 0) await db.insert(incomes).values(cloneData(adminInc));
        if (adminExp.length > 0) await db.insert(expenses).values(cloneData(adminExp));

        if (adminRV) {
            console.log("Cloning core RV profile...");
            const newRvId = uuidv4();
            const { id: _, createdAt: __, updatedAt: ___, ...rvData } = adminRV as any;
            await db.insert(rvVehicles).values({ id: newRvId, ...rvData, userId: DEMO_ID });

            if (powerSys) {
                const { id: _, rvId: __, updatedAt: ___, ...pData } = powerSys as any;
                await db.insert(powerSystems).values({ id: uuidv4(), rvId: newRvId, ...pData });
            }
            if (waterSys) {
                const { id: _, rvId: __, updatedAt: ___, ...wData } = waterSys as any;
                await db.insert(waterSystems).values({ id: uuidv4(), rvId: newRvId, ...wData });
            }
            if (financials) {
                const { id: _, rvId: __, updatedAt: ___, ...fData } = financials as any;
                await db.insert(financialData).values({ id: uuidv4(), rvId: newRvId, ...fData });
            }

            const cloneRvArray = (dataArray: any[]) => {
                return dataArray.map((row) => {
                    const { id, createdAt, updatedAt, rvId, ...rest } = row as any;
                    return {
                        ...rest,
                        id: uuidv4(),
                        rvId: newRvId
                    };
                });
            };

            if (electricDevs && electricDevs.length > 0) await db.insert(electricalDevices).values(cloneRvArray(electricDevs));
            if (solarEquip && solarEquip.length > 0) await db.insert(solarEquipment).values(cloneRvArray(solarEquip));
            if (solarLogs && solarLogs.length > 0) await db.insert(dailySolarLogs).values(cloneRvArray(solarLogs));
        }

        console.log("SUCCESS! Demo Database Fully Overwritten via Auth-bypass script.");
    } catch (error) {
        console.error("Failed executing demo clone pipeline:", error);
    }
}

forcePublishToDemo().catch(console.error);
