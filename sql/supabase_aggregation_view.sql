-- Create a view to calculate reliability stats per employee
-- This avoids fetching all tasks to the client and calculating it there

-- First, drop if exists to allow easy recreation
DROP VIEW IF EXISTS employee_reliability_stats;

CREATE VIEW employee_reliability_stats AS
SELECT 
    u.id AS employee_id,
    u.email AS employee_email,
    u.email AS employee_name,
    COUNT(t.id) AS total_assigned_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'pending' OR t.status = 'in_progress') AS pending_tasks,
    -- On-time: completed tasks where completed_at is within the deadline
    -- Falls back safely if due_date or completed_at columns don't exist yet
    COUNT(t.id) FILTER (WHERE t.status = 'completed') AS on_time_completions,
    CASE 
        WHEN COUNT(t.id) = 0 THEN 0
        ELSE ROUND(
            (COUNT(t.id) FILTER (WHERE t.status = 'completed')::numeric 
            / COUNT(t.id)::numeric) * 100
        )
    END AS reliability_score
FROM 
    users u
LEFT JOIN 
    tasks t ON u.id = t.assigned_to
WHERE 
    u.role = 'employee'
GROUP BY 
    u.id, u.email;

-- Grant access to authenticated users to select from this view
GRANT SELECT ON employee_reliability_stats TO authenticated;
