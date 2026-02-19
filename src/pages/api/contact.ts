import type { APIRoute } from "astro";
import { Resend } from "resend";

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();

        const name = String(formData.get("name") || "");
        const email = String(formData.get("email") || "");
        const message = String(formData.get("message") || "");
        const subject = String(formData.get("subject") || "");

        if (!name || !email || !message) {
            return new Response(
                JSON.stringify({ ok: false, error: "Missing required fields." }),
                { status: 400 },
            );
        }
        console.log("Received contact form submission:", import.meta.env.RESEND_API_KEY);
        const resend = new Resend(import.meta.env.RESEND_API_KEY);

        await resend.emails.send({
            from: "Bitelex <onboarding@resend.dev>", // kasnije zamijeni sa verified domain
            to: ["pipiklepic1@gmail.com"], // ili tvoj business mail
            replyTo: email,
            subject: `New quote request — ${subject || "No subject"}`,
            text: `
                Name: ${name}
                Email: ${email}
               

                    Message:
                    ${message}
                        `.trim(),
        });

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: "Server error." }), {
            status: 500,
        });
    }
};
