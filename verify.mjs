import { createClient } from '@supabase/supabase-js'
const sb = createClient(
  'https://poacwioygsyioyikkzvw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvYWN3aW95Z3N5aW95aWtrenZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDUwNTcsImV4cCI6MjEwNDAyMTA1N30.JdD524tgRHDrZ5EZs3tESt8IYyYxVsaFkpA3BiihMv8'
)
const { data, error } = await sb.from('profiles').select('id, username, display_name, current_streak')
if (error) console.error('ERR:', error)
else console.log('Users:', data.length, 'rows')
data?.forEach(d => console.log(' -', d.username || d.display_name, '|', d.id.substring(0, 8)))

const { data: rooms } = await sb.from('rooms').select('id, name, current_room_streak, member_count')
console.log('\nRooms:', rooms?.length)
rooms?.forEach(r => console.log(' -', r.name, '| streak:', r.current_room_streak))
