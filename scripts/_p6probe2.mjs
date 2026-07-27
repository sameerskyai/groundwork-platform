import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('/Users/ryanbaz/Desktop/groundwork-platform/.env.local','utf8').split('\n').filter(Boolean).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const P='610c1a13-a8cb-4dfb-be00-be4488beb04b'
const { data: m } = await sb.from('matches').select('*').eq('project_id',P)
console.log('matches for project:', JSON.stringify(m,null,1))
const { data: s } = await sb.from('swipes').select('*').eq('project_id',P)
console.log('swipes:', JSON.stringify(s,null,1))
const { data: ps } = await sb.from('project_steps').select('*').eq('project_id',P).limit(3)
console.log('project_steps:', ps?.length, JSON.stringify(ps?.[0]))
const { data: pr } = await sb.from('projects').select('*').eq('id',P).single()
console.log('project cols:', Object.keys(pr))
const { data: cp } = await sb.from('contractor_profiles').select('*').eq('id','daa5f864-42b7-45a3-b2c0-15c9a771e58e').single()
console.log('contractor_profiles cols:', Object.keys(cp))
