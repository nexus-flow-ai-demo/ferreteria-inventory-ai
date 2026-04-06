import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite data extraction AI for a hardware store (ferretería). 
Extract the invoice header AND every single line item from the provided image.
Return ONLY a valid JSON object with no markdown, no explanation, no extra text.

Use this EXACT JSON schema:
{
  "issuer_name": "Store/Provider name",
  "issuer_tax_id": "Tax ID / RIF / NIT",
  "payment_date": "YYYY-MM-DD",
  "total_amount": 0.00,
  "items": [
    {
      "item_name": "Exact name/description of the product (e.g., Tornillo Hexagonal 1/4)",
      "quantity": 0.0,
      "unit": "Unit of measurement (e.g., UND, MTR, KG, PZA, CAJA)",
      "unit_price": 0.00
    }
  ]
}

Rules:
- amount, quantity, and unit_price MUST be numbers (floats), not strings.
- date must be YYYY-MM-DD.
- If a value cannot be found, use null for strings and 0 for numbers.
- Ensure the total_amount matches the sum of (quantity * unit_price) if visible.
- DO NOT wrap the JSON in markdown blocks like \`\`\`json.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
              {
                type: "text",
                text: "Extract the invoice data from this image.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response
    let parsed;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("La IA no pudo extraer datos estructurados de la ferretería.");
    }

    // Validate and sanitize nested data
    const invoiceData = {
      issuer_name: String(parsed.issuer_name || ""),
      issuer_tax_id: parsed.issuer_tax_id ? String(parsed.issuer_tax_id) : null,
      payment_date: String(parsed.payment_date || new Date().toISOString().split("T")[0]),
      total_amount: typeof parsed.total_amount === "number" ? parsed.total_amount : parseFloat(parsed.total_amount) || 0,
      items: Array.isArray(parsed.items) ? parsed.items.map((item: any) => ({
        item_name: String(item.item_name || "Producto Desconocido"),
        quantity: typeof item.quantity === "number" ? item.quantity : parseFloat(item.quantity) || 1,
        unit: String(item.unit || "UND"),
        unit_price: typeof item.unit_price === "number" ? item.unit_price : parseFloat(item.unit_price) || 0,
      })) : []
    };

    return new Response(JSON.stringify(invoiceData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-invoice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error procesando la factura" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
