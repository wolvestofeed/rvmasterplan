"use server";

import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-helpers";

export async function saveExpense(data: {
    name: string;
    amount: number;
    category: string;
    isFuelEvent?: boolean;
    isPropaneEvent?: boolean;
    gallons?: number;
    odometerReading?: number;
    isHitched?: boolean;
    stateLocation?: string;
    date?: string;
    receiptUrl?: string;
}) {
    const userId = await requireAuth();

    const id = uuidv4();

    await db.insert(expenses).values({
        id,
        userId,
        name: data.name,
        amount: data.amount.toString(),
        category: data.category,
        isFuelEvent: data.isFuelEvent || false,
        isPropaneEvent: data.isPropaneEvent || false,
        gallons: data.gallons?.toString(),
        odometerReading: data.odometerReading,
        isHitched: data.isHitched || false,
        stateLocation: data.stateLocation,
        receiptUrl: data.receiptUrl,
    });

    revalidatePath("/calculators/budget");
    revalidatePath("/fuel-economy");

    return { success: true, id };
}
