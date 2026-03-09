import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Allow streaming responses but we'll use generateObject for structured data
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return new Response('No image provided', { status: 400 });
        }

        // Determine the model
        // Note: User referred to Gemini 3.1 Pro, but standard SDK uses gemini-1.5-pro or similar.
        // We will use the latest available Gemini 1.5 Pro which supports high-quality vision.
        const model = google('models/gemini-1.5-pro-latest');

        const result = await generateObject({
            model,
            schema: z.object({
                type: z.enum(['Fuel', 'Propane', 'General']),
                vendor: z.string().describe('The name of the vendor or store'),
                totalAmount: z.number().describe('The total amount paid'),
                date: z.string().describe('The date of the transaction (ISO format if possible)'),
                // Fuel specific fields
                gallons: z.number().optional().describe('Number of gallons purchased (if Fuel or Propane)'),
                pricePerGallon: z.number().optional().describe('Price per gallon (if Fuel)'),
                state: z.string().optional().describe('The US state where the purchase was made'),
                // Nomadic context
                notes: z.string().optional().describe('Any additional nomadic/contextual notes identified by the AI'),
            }),
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'You are an expert at extracting data from receipts for nomadic RV travelers. ' +
                                'Focus on accurate extraction of Total $, Vendor, and Date. ' +
                                'Identify if the receipt is for Fuel (Gas/Diesel), Propane, or a General nomad expense. ' +
                                'If Fuel, extract Gallons, Price per Gallon, and State. ' +
                                'If Propane, extract Gallons/Lbs and Vendor. ' +
                                'Tone: Target the "intentional nomad" (van life/trailers). Avoid luxury RV categories.',
                        },
                        {
                            type: 'image',
                            image: image.split(',')[1], // Remove "data:image/jpeg;base64," prefix if present
                        },
                    ],
                },
            ],
        });

        return new Response(JSON.stringify(result.object), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Extraction error:', error);
        return new Response('Failed to extract data', { status: 500 });
    }
}
