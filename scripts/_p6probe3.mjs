import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('/Users/ryanbaz/Desktop/groundwork-platform/.env.local','utf8').split('\n').filter(Boolean).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const { data: auth, error: ae } = await sb.auth.signInWithPassword({ email:'founder.demo@example.com', password:'FounderDemo123!' })
console.log('auth:', ae?.message ?? auth.user.id)

const tests = {
  'conv+contractor+profiles': sb.from('conversations').select('id, contractor_id, match_id, updated_at, contractor:contractor_id(id, business_name, profiles(avatar_url)), messages(content, created_at)').eq('homeowner_id', auth.user.id),
  'conv+contractor only': sb.from('conversations').select('id, contractor_id, match_id, updated_at, contractor:contractor_id(id, business_name, rating, trust_score), messages(id, sender_id, sender_type, content, created_at)').eq('homeowner_id', auth.user.id),
  'community detail': sb.from('communities').select('id, name, description, zip_code').eq('id','bf09e8da-a994-4ccb-a205-62cb7a2ac2bb').single(),
  'community_posts': sb.from('community_posts').select('id, user_id, title, description, project_type, created_at').eq('community_id','bf09e8da-a994-4ccb-a205-62cb7a2ac2bb'),
  'member count': sb.from('community_members').select('id',{count:'exact',head:true}).eq('community_id','bf09e8da-a994-4ccb-a205-62cb7a2ac2bb'),
  'matches list': sb.from('matches').select('id, match_score, match_reasoning, contractor:contractor_id(id, business_name, rating, review_count, verified_job_count, years_in_business)').eq('project_id','610c1a13-a8cb-4dfb-be00-be4488beb04b').gte('match_score',0.8),
  'insert conversation dup-check': sb.from('conversations').select('id').eq('homeowner_id',auth.user.id).eq('contractor_id','d24d1dc4-50fb-4f6c-a50a-78cbcf2f25cc').maybeSingle(),
  'project_steps': sb.from('project_steps').select('id, step_number, title, description, completed').eq('project_id','610c1a13-a8cb-4dfb-be00-be4488beb04b'),
  'project real cols': sb.from('projects').select('id, title, description, status, budget_min, budget_max, created_at').eq('id','610c1a13-a8cb-4dfb-be00-be4488beb04b').single(),
}
for (const [k,q] of Object.entries(tests)) {
  const r = await q
  console.log('---', k, r.error ? 'ERR '+r.error.code+' '+r.error.message : (r.count!==null&&r.count!==undefined?('count='+r.count):JSON.stringify(r.data).slice(0,700)))
}
