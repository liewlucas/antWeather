import type { Env } from "../config";
import type { CheckResult } from "./rain-detector";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are a rain monitoring bot for the Changi area in Singapore. You have access to live rainfall data from NEA (National Environment Agency) stations and radar imagery.

When given weather data, answer the user's question based on that data. Be concise and conversational — this is a Telegram chat, not a report. Keep replies under 200 words.

If the data shows rain, mention which stations are reporting and the readings. If it's dry, say so confidently.

You only answer weather-related questions about the monitored region near Changi, Singapore. If the question is not about weather, politely decline and suggest they ask about rain or weather instead.`;

function buildWeatherContext(result: CheckResult): string {
    const lines: string[] = [];
    lines.push(`Current time (SGT): ${new Date().toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}`);
    lines.push(`Rain detected: ${result.isRaining ? "Yes" : "No"}`);
    lines.push(`Max rainfall: ${result.maxRainfallMm}mm`);
    lines.push(`Nearby stations checked: ${result.nearbyStations.length}`);

    if (result.rainingStations.length > 0) {
        lines.push(`Stations reporting rain:`);
        for (const s of result.rainingStations) {
            lines.push(`  - ${s.name}: ${s.rainfallMm}mm (${s.distanceKm.toFixed(1)}km away)`);
        }
    } else {
        lines.push(`No stations reporting rainfall.`);
    }

    if (result.radarImage) {
        const sizeKb = (result.radarImage.byteLength / 1024).toFixed(1);
        lines.push(`Radar image size: ${sizeKb}KB (larger = more precipitation visible)`);
    }

    return lines.join("\n");
}

export async function askGemini(
    env: Env,
    userMessage: string,
    weatherData: CheckResult
): Promise<string> {
    if (!env.GEMINI_API_KEY) {
        return "Gemini API key not configured.";
    }

    const context = buildWeatherContext(weatherData);

    const body = {
        system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
            {
                role: "user",
                parts: [
                    { text: `Live weather data:\n${context}\n\nUser question: ${userMessage}` },
                ],
            },
        ],
        generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
        },
    };

    try {
        const res = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            console.error("Gemini API error:", res.status, await res.text());
            return "Sorry, I couldn't process that right now. Try again later.";
        }

        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return "Sorry, I didn't get a response. Try again.";
        }

        // Telegram has a 4096 char limit
        return text.length > 4000 ? text.slice(0, 4000) + "..." : text;
    } catch (err) {
        console.error("Gemini fetch failed:", err);
        return "Sorry, something went wrong. Try again later.";
    }
}
