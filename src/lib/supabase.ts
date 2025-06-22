import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjhncazsvvpdfgwhjzzu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaG5jYXpzdnZwZGZnd2hqenp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDE1MDUsImV4cCI6MjA2NjE3NzUwNX0.86Kz3UVnYiYmS9TY-xod2HLFRG_CvryPYyJlUvUuZrM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveTaskUpdate({
  phaseId,
  taskId,
  taskName,
  details,
  colors,
  source,
  status,
  completed,
}: {
  phaseId: string;
  taskId: string;
  taskName: string;
  details?: string;
  colors?: { primary: string; secondary: string };
  source?: string;
  status?: string;
  completed?: boolean;
}) {
  const { error } = await supabase.from('task_updates').insert([
    {
      phase_id: phaseId,
      task_id: taskId,
      task_name: taskName,
      details,
      colors,
      source,
      status,
      completed,
    },
  ]);
  if (error) {
    console.error('Supabase insert error:', error);
  }
}

export async function clearPhase1TaskUpdates() {
  const { error } = await supabase
    .from('task_updates')
    .delete()
    .eq('phase_id', '1');
  if (error) {
    console.error('Supabase delete error:', error);
  }
} 