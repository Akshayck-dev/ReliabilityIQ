import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const CLAWBOLT_API_KEY = Deno.env.get("CLAWBOLT_API_KEY");
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Missing Supabase Environment Variables");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();
        const nowStr = new Date().toISOString();

        // 2. Fetch Data
        // Total assigned tasks in the last 7 days
        const { data: assignedTasks, error: assignedErr } = await supabase
            .from('tasks')
            .select('id')
            .gte('created_at', sevenDaysAgoStr);

        if (assignedErr) throw new Error("Error fetching assigned tasks: " + assignedErr.message);

        // Completed tasks in the last 7 days
        const { data: completedTasks, error: completedErr } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'completed')
            .gte('completed_at', sevenDaysAgoStr);

        if (completedErr) throw new Error("Error fetching completed tasks: " + completedErr.message);

        // Overdue tasks (currently pending and past due)
        const { data: overdueTasks, error: overdueErr } = await supabase
            .from('tasks')
            .select('id')
            .neq('status', 'completed')
            .lt('due_date', nowStr)
            .not('due_date', 'is', null);

        if (overdueErr) throw new Error("Error fetching overdue tasks: " + overdueErr.message);

        // Calculate Team Reliability % (Last 7 Days)
        let onTimeCount = 0;
        completedTasks.forEach(t => {
            if (!t.due_date) {
                onTimeCount++;
            } else {
                const completedAt = new Date(t.completed_at || t.updated_at || t.created_at);
                const due = new Date(t.due_date);
                
                // Set to start of day for comparison
                const cDay = new Date(completedAt.getFullYear(), completedAt.getMonth(), completedAt.getDate());
                const dDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                
                if (cDay.getTime() <= dDay.getTime()) {
                    onTimeCount++;
                }
            }
        });

        const totalCompleted = completedTasks.length;
        const teamReliability = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 100;

        // Employees below 50% reliability
        const { data: employees, error: empErr } = await supabase
            .from('users')
            .select('id, email')
            .eq('role', 'employee');

        if (empErr) throw new Error("Error fetching employees: " + empErr.message);

        const { data: recentTasks, error: recTaskErr } = await supabase
            .from('tasks')
            .select('*')
            .gte('created_at', sevenDaysAgoStr);
            
        if (recTaskErr) throw new Error("Error fetching recent tasks: " + recTaskErr.message);

        const lowPerformers = [];
        employees.forEach(emp => {
            const empTasks = recentTasks.filter(t => t.assigned_to === emp.id);
            if (empTasks.length === 0) return;

            const empCompleted = empTasks.filter(t => t.status === 'completed');
            if (empCompleted.length === 0) return;

            let empOnTime = 0;
            empCompleted.forEach(t => {
                if (!t.due_date) {
                    empOnTime++;
                    return;
                }
                const cTime = new Date(t.completed_at || t.created_at).getTime();
                const dTime = new Date(t.due_date).getTime();
                if (cTime <= dTime) {
                    empOnTime++;
                }
            });

            const rel = Math.round((empOnTime / empCompleted.length) * 100);
            if (rel < 50) {
                lowPerformers.push(`${emp.email.split('@')[0]} (${rel}%)`);
            }
        });

        const statsText = `
        - Total tasks assigned: ${assignedTasks.length}
        - Tasks completed: ${totalCompleted}
        - Tasks currently overdue: ${overdueTasks.length}
        - Team Reliability Score: ${teamReliability}%
        - Employees needing attention (<50%): ${lowPerformers.length > 0 ? lowPerformers.join(', ') : 'None'}
        `;

        // 3. Generate Summary with Clawbolt AI
        let aiSummary = "Here is your automated weekly summary from ReliabilityIQ.";
        if (CLAWBOLT_API_KEY) {
            try {
                // Adjust this endpoint based on actual Clawbolt API documentation
                const response = await fetch("https://api.clawbolt.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${CLAWBOLT_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "clawbolt-pro", // Placeholder
                        messages: [
                            { role: "system", content: "You are an AI assistant for ReliabilityIQ. Generate a short, professional summary paragraph for a weekly team performance report based on the provided metrics. Keep it encouraging but realistic." },
                            { role: "user", content: `Weekly Metrics:\n${statsText}` }
                        ]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    aiSummary = data.choices?.[0]?.message?.content || aiSummary;
                } else {
                    console.warn("Clawbolt API error:", await response.text());
                }
            } catch (aiErr) {
                console.warn("Failed to reach Clawbolt API:", aiErr);
            }
        }

        // 4. Send Email with Resend
        if (!RESEND_API_KEY) {
            return new Response(JSON.stringify({
                message: "Generated report successfully, but RESEND_API_KEY is missing. Email not sent.",
                statsText,
                aiSummary
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Fetch managers to send to
        const { data: managers } = await supabase.from('users').select('email').eq('role', 'manager');
        const managerEmails = managers?.map(m => m.email) || [];

        if (managerEmails.length === 0) {
           return new Response(JSON.stringify({ message: "No managers found to email." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }); 
        }

        const htmlEmail = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 24px;">ReliabilityIQ</h2>
                <p style="color: #94a3b8; margin: 8px 0 0 0;">Weekly Performance Report</p>
            </div>
            
            <div style="padding: 32px 24px;">
                <h3 style="margin-top: 0; color: #0f172a;">AI Executive Summary</h3>
                <p style="line-height: 1.6; color: #475569; padding: 16px; background-color: #f8fafc; border-left: 4px solid #ea580c; border-radius: 0 8px 8px 0;">
                    ${aiSummary}
                </p>

                <h3 style="margin-top: 32px; color: #0f172a;">Weekly Metrics (Last 7 Days)</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Team Reliability</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${teamReliability >= 80 ? '#10b981' : '#ef4444'}; font-weight: bold;">${teamReliability}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Total Tasks Assigned</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${assignedTasks.length}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Tasks Completed</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${totalCompleted}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Currently Overdue</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${overdueTasks.length}</td>
                    </tr>
                </table>

                ${lowPerformers.length > 0 ? `
                <h3 style="margin-top: 32px; color: #ef4444;">Needs Attention (<50% Reliability)</h3>
                <ul style="color: #475569;">
                    ${lowPerformers.map(p => `<li>${p}</li>`).join('')}
                </ul>
                ` : `
                <p style="margin-top: 32px; color: #10b981; font-weight: bold;">🎉 All tracked employees maintained >50% reliability this week!</p>
                `}
            </div>
            
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0;">This is an automated message from ReliabilityIQ.</p>
            </div>
        </div>
        `;

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'ReliabilityIQ <reports@reliabilityiq.com>', // Update with verified Resend domain
                to: managerEmails,
                subject: `Weekly Performance Report - ${new Date().toLocaleDateString()}`,
                html: htmlEmail
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.text();
            throw new Error(`Resend API Error: ${errorData}`);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Report sent to ${managerEmails.length} manager(s).`,
            aiSummary
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error("Function Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
