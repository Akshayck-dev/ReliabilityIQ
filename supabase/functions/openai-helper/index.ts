import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS Preflight Required by Browsers
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // 2. Validate User Authentication
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) throw new Error("Unauthorized access. User must be logged in.")

        // 3. Initialize OpenAI Server-Side using Secret keys (never exposed to browser)
        const configuration = new Configuration({
            apiKey: Deno.env.get('OPENAI_API_KEY'),
        })
        const openai = new OpenAIApi(configuration)

        // 4. Parse request for AI action type
        const { action, payload } = await req.json()

        let result = null;

        switch (action) {
            case 'summarize_remarks': {
                // Takes an array of remarks and outputs a 1-2 sentence summary
                if (!payload.remarks || payload.remarks.length === 0) {
                    throw new Error("No remarks provided to summarize.");
                }
                const formattedConversation = payload.remarks.map(r => `${r.author_email}: ${r.text}`).join('\n');
                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are an expert product manager. Summarize the following discussion concisely in 1 or 2 sentences." },
                        { role: "user", content: formattedConversation }
                    ],
                });
                result = completion.data.choices[0].message?.content;
                break;
            }

            case 'tone_adjustment': {
                // Rewrites text to be highly professional
                if (!payload.text) throw new Error("No text provided to refine.");
                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "Rewrite the following text to be highly professional, polite, and concise for a workplace task management system. Output ONLY the rewritten text." },
                        { role: "user", content: payload.text }
                    ],
                });
                result = completion.data.choices[0].message?.content;
                break;
            }

            case 'smart_assignment': {
                // Suggests an employee based on past performance data
                if (!payload.task_title || !payload.task_description || !payload.employees) throw new Error("Missing assignment data.");
                
                const prompt = `
                I need to assign a task titled "${payload.task_title}" (${payload.task_description}).
                Here is the list of available employees and their current active task count:
                ${JSON.stringify(payload.employees, null, 2)}
                
                Choose the best available employee ID based strictly on balancing workload (favor those with fewer active tasks). 
                Output ONLY valid JSON in this exact format:
                {"suggested_employee_id": "uuid-here", "reason": "Short reason why they were chosen."}
                `;

                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are an intelligent team lead router. You output pure JSON." },
                        { role: "user", content: prompt }
                    ],
                });

                try {
                    result = JSON.parse(completion.data.choices[0].message?.content || '{}');
                } catch (e) {
                    throw new Error("AI failed to output valid JSON assignment.");
                }
                break;
            }

            default:
                throw new Error("Invalid AI action specified.");
        }

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
