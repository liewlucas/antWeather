import type { Env } from "../config";
import { fullCheck } from "../services/rain-detector";
import { saveCapture } from "../services/capture-svc";
import { sendTelegramStatus } from "../services/alert-svc";
import { json } from "./router";

export async function postWebhook(
    req: Request,
    env: Env
): Promise<Response> {
    try {
        const body: any = await req.json();

        if (body.message && body.message.text) {
            const text = body.message.text.trim();
            const chatId = body.message.chat.id.toString();

            // Only respond to the configured chat group and specifically the /checknow command
            if (
                chatId === env.TELEGRAM_CHAT_ID &&
                text.startsWith("/checknow")
            ) {
                console.log("Received /checknow from Telegram webhook");

                // Run the manual check logic
                const result = await fullCheck(env);

                if (result.isRaining && result.radarImage) {
                    try {
                        await saveCapture(env, result);
                    } catch (err) {
                        console.error("Capture failed via webhook:", err);
                    }
                }

                // Reply to the telegram user with the status
                await sendTelegramStatus(env, result);
            }
        }

        // Always respond 200 OK so Telegram considers the webhook delivered
        return json({ ok: true });
    } catch (err) {
        console.error("Webhook error:", err);
        // Return 200 even on error so Telegram doesn't retry a malformed payload infinitely
        return json({ ok: false, error: "Internal error" }, 200);
    }
}
