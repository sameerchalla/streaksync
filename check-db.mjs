import { createClient } from '@supabase/supabase-js'
const sb = createClient(
  'https://poacwioygsyioyikkzvw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvYWN3aW95Z3N5aW95aWtrenZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDUwNTcsImV4cCI6MjEwNDAyMTA1N30.JdD524tgRHDrZ5EZs3tESt8IYyYxVsaFkpA3BiihMv8'
)
const { data: profiles } = await sb.from('profiles').select('id, username, display_name, current_streak')
console.log('=== PROFILES ===')
profiles?.forEach(p => console.log(`  ${p.username} (${p.display_name}) | id:${p.id.slice(0,8)} | streak:${p.current_streak}`))

const { data: rooms } = await sb.from('rooms').select('id, name, current_room_streak, member_count, is_public, created_by')
console.log('\n=== ROOMS ===')
rooms?.forEach(r => console.log(`  "${r.name}" | streak:${r.current_room_streak} | members:${r.member_count} | public:${r.is_public} | created_by:${r.created_by?.slice(0,8) || 'null'}`))

const { data: members } = await sb.from('room_members').select('user_id, room_id, is_active')
console.log(`\n=== ROOM_MEMBERS (${members?.length || 0} total) ===`)

const { data: checkins } = await sb.from('check_ins').select('user_id, room_id, check_in_date')
console.log(`=== CHECK_INS (${checkins?.length || 0} total) ===`)
