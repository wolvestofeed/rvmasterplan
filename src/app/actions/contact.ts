"use server";

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

    // TODO: Wire up to email service (SendGrid, Resend, etc.) or form provider
    console.log("Contact form submission:", { name, email, subject, message });

    return { success: true };
}
