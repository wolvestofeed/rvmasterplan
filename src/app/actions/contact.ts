"use server";

import { resend } from "@/lib/resend";

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function submitContactForm(data: ContactFormData) {
    const { name, email, subject, message } = data;

    if (!name || !email || !subject || !message) {
        return { success: false, error: "All fields are required." };
    }

    try {
        await resend.emails.send({
            from: "RVMP Contact <noreply@rvmasterplan.app>",
            to: "lonewolf@rvmasterplan.app",
            replyTo: email,
            subject: `[RVMP Contact] ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr />
                <p>${message.replace(/\n/g, "<br />")}</p>
            `,
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to send contact email:", error);
        return { success: false, error: "Failed to send message. Please try again." };
    }
}
