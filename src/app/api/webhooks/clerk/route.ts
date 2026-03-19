import { randomUUID } from 'crypto'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users, userProfiles } from '@/lib/db/schema'

export async function POST(req: Request) {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400,
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error occured', {
            status: 400,
        })
    }

    const eventType = evt.type

    if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name, unsafe_metadata } = evt.data
        const email = email_addresses[0]?.email_address

        // Check if they entered the special registration code
        const accessCode = unsafe_metadata?.accessCode as string | undefined
        const isTrial = accessCode && accessCode === process.env.TRIAL_ACCESS_CODE

        try {
            // 1. Create the base User
            await db.insert(users).values({
                id: id,
                email: email || '',
            })

            // 2. Create the User Profile
            const defaultDate = new Date()
            // If code matches, grant 30 days. Otherwise, leave it expired/inactive.
            if (isTrial) {
                defaultDate.setDate(defaultDate.getDate() + 30)
            } else {
                // Just set it to the past so it's instantly expired
                defaultDate.setDate(defaultDate.getDate() - 1)
            }

            await db.insert(userProfiles).values({
                id: randomUUID(),
                userId: id,
                firstName: first_name || null,
                lastName: last_name || null,
                subscriptionStatus: isTrial ? 'active' : 'inactive',
                subscriptionRenewalDate: isTrial ? defaultDate : null,
            })

            console.log(`Successfully provisioned new user ${id}. Trial Access: ${isTrial}`)
        } catch (dbError) {
            console.error('Error saving user to DB:', dbError)
            return new Response('Database error', { status: 500 })
        }
    }

    return new Response('', { status: 200 })
}
