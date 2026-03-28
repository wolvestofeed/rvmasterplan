import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
        }

        const body = await req.json();
        const code = body.code as string;

        // Check against trial code (free-trial signup) or renewal code (renew page)
        const TRIAL_CODE = process.env.TRIAL_ACCESS_CODE || "RVMP2026FREE";
        const RENEWAL_CODE = process.env.RENEWAL_ACCESS_CODE || "RENRVMP";

        const isTrialCode = code === TRIAL_CODE;
        const isRenewalCode = code === RENEWAL_CODE;

        if (!isTrialCode && !isRenewalCode) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid or expired registration code.' }), { status: 400 });
        }

        // Trial code: 30 days. Renewal code: 30 days (same duration, separate code).
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        await db.update(userProfiles)
            .set({
                subscriptionStatus: 'active',
                subscriptionRenewalDate: trialEndDate
            })
            .where(eq(userProfiles.userId, userId));

        revalidatePath('/dashboard');
        revalidatePath('/settings');
        revalidatePath('/welcome');

        return new Response(JSON.stringify({ success: true }));
    } catch (e: any) {
        console.error("Error applying code:", e);
        return new Response(JSON.stringify({ success: false, error: "Internal Server Error" }), { status: 500 });
    }
}
