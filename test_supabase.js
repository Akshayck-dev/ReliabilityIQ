import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
    const { data: tasks } = await supabase.from('tasks').select('id').limit(1);
    if (!tasks || tasks.length === 0) {
        console.log("No tasks found");
        return;
    }
    const taskId = tasks[0].id;

    console.log("Testing with task ID:", taskId);

    // Test updating with a new column
    const { data, error } = await supabase
        .from('tasks')
        .update({
            subtasks: [{ id: '1', title: 'Test Subtask', completed: false }]
        })
        .eq('id', taskId);

    if (error) {
        console.error("ERROR:");
        console.error(error);
    } else {
        console.log("SUCCESS!");
        console.log(data);
    }
}

test();
