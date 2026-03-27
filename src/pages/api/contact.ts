import type { APIRoute } from "astro";
import { Resend } from "resend";

export const POST: APIRoute = async ({ request }) => {
    try {
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");
        if (origin && host) {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                return new Response(JSON.stringify({ ok: false, error: "Invalid origin." }), {
                    status: 403,
                });
            }
        }

        const formData = await request.formData();

        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const subject = String(formData.get("subject") || "").trim();
        const honeypot = String(formData.get("bot-field") || "").trim();

        if (honeypot) {
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!name || !email || !message) {
            return new Response(
                JSON.stringify({ ok: false, error: "Missing required fields." }),
                { status: 400 },
            );
        }

        if (!emailPattern.test(email)) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid email." }), {
                status: 400,
            });
        }

        if (name.length > 120 || subject.length > 180 || message.length > 5000) {
            return new Response(JSON.stringify({ ok: false, error: "Input too long." }), {
                status: 400,
            });
        }

        const resendKey = import.meta.env.RESEND_API_KEY;
        if (!resendKey) {
            return new Response(
                JSON.stringify({ ok: false, error: "Service unavailable." }),
                { status: 503 },
            );
        }

        const resend = new Resend(resendKey);

        await resend.emails.send({
            from: "Bitelex <onboarding@resend.dev>",
            to: ["pipiklepic1@gmail.com"],
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
    } catch {
        return new Response(JSON.stringify({ ok: false, error: "Server error." }), {
            status: 500,
        });
    }
};
