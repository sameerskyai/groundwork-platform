import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('/Users/ryanbaz/Desktop/groundwork-platform/.env.local','utf8').split('\n').filter(Boolean).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data: u } = await sb.auth.admin.listUsers()
const founder = u.users.find(x=>x.email==='founder.demo@example.com')
console.log('founder id:', founder?.id)
const id = founder.id
for (const [t, q] of [
  ['profiles', sb.from('profiles').select('*').eq('id',id)],
  ['properties', sb.from('properties').select('*').eq('owner_id',id)],
  ['projects', sb.from('projects').select('id,description,status,zip_code,created_at').eq('user_id',id)],
  ['communities', sb.from('communities').select('*')],
  ['community_members', sb.from('community_members').select('*').eq('user_id',id)],
  ['community_posts', sb.from('community_posts').select('*')],
  ['conversations', sb.from('conversations').select('*').eq('homeowner_id',id)],
  ['messages', sb.from('messages').select('id,conversation_id,match_id,sender_id,content,created_at').limit(20)],
  ['contractor_profiles', sb.from('contractor_profiles').select('id,user_id,business_name').limit(10)],
]) {
  const { data, error } = await q
  console.log('---', t, error ? 'ERR '+error.message : JSON.stringify(data,null,1).slice(0,1500))
}
