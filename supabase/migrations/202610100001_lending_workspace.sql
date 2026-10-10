-- Apply in a new Supabase project. All private rows are owned by auth.uid().
create extension if not exists vector with schema extensions;
create table public.businesses(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, name text not null default 'My business', data jsonb not null default '{}', revision int not null default 1, updated_at timestamptz not null default now(), unique(id,user_id));
create table public.conversations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,business_id uuid not null,role text not null check(role in ('user','assistant')),content text not null,created_at timestamptz not null default now(),foreign key(business_id,user_id) references public.businesses(id,user_id) on delete cascade);
create table public.uploads(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,business_id uuid not null,name text not null,path text not null,mime text not null,size bigint not null,format_guidance jsonb,kind text not null check(kind in ('financial','audio','style')),status text not null default 'uploaded',created_at timestamptz not null default now(),foreign key(business_id,user_id) references public.businesses(id,user_id) on delete cascade,unique(id,user_id));
create table public.extracted_figures(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,business_id uuid not null,upload_id uuid not null,data jsonb not null,reviewed boolean not null default false,created_at timestamptz not null default now(),foreign key(business_id,user_id) references public.businesses(id,user_id) on delete cascade,foreign key(upload_id,user_id) references public.uploads(id,user_id) on delete cascade);
create table public.assumptions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,business_id uuid not null,data jsonb not null,confirmed_at timestamptz,foreign key(business_id,user_id) references public.businesses(id,user_id) on delete cascade);
create table public.report_versions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,business_id uuid not null,type text not null check(type in ('project','cma')),input jsonb not null,calculation jsonb not null,paths jsonb not null default '{}',created_at timestamptz not null default now(),foreign key(business_id,user_id) references public.businesses(id,user_id) on delete cascade);
create table public.jobs(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,business_id uuid not null,kind text not null check(kind in ('transcribe','extract','conversation','report','format')),payload jsonb not null default '{}',status text not null default 'queued' check(status in ('queued','running','succeeded','failed')),progress int not null default 0,attempts int not null default 0,max_attempts int not null default 3,error text,result jsonb,available_at timestamptz not null default now(),lease_until timestamptz,created_at timestamptz not null default now(),foreign key(business_id,user_id) references public.businesses(id,user_id) on delete cascade);
create table public.reference_versions(id uuid primary key default gen_random_uuid(),version text not null,url text not null,title text not null,retrieved_at timestamptz not null,sha256 text not null,status text not null,metadata jsonb not null default '{}',unique(version,url));
create table public.reference_chunks(id uuid primary key default gen_random_uuid(),version_id uuid not null references public.reference_versions on delete cascade,page int,content text not null,metadata jsonb not null default '{}',embedding extensions.vector(1536));
create table public.private_embeddings(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,business_id uuid not null,upload_id uuid not null,location text not null,content text not null,embedding extensions.vector(1536),foreign key(business_id,user_id) references public.businesses(id,user_id) on delete cascade,foreign key(upload_id,user_id) references public.uploads(id,user_id) on delete cascade);
do $$ declare t text; begin foreach t in array array['businesses','conversations','uploads','extracted_figures','assumptions','report_versions','jobs','private_embeddings'] loop execute format('alter table public.%I enable row level security',t);execute format('create policy owner_select on public.%I for select to authenticated using (user_id = (select auth.uid()))',t);end loop;end $$;
-- Mutations are mediated by authenticated server routes; never trust client ownership fields.
revoke all on public.businesses,public.conversations,public.uploads,public.extracted_figures,public.assumptions,public.report_versions,public.jobs,public.private_embeddings from anon,authenticated;
grant select on public.businesses,public.conversations,public.uploads,public.extracted_figures,public.assumptions,public.report_versions,public.jobs,public.private_embeddings to authenticated;
alter table public.reference_versions enable row level security;alter table public.reference_chunks enable row level security;
create policy reference_versions_read on public.reference_versions for select to authenticated using (true);
create policy reference_chunks_read on public.reference_chunks for select to authenticated using (true);
grant select on public.reference_versions,public.reference_chunks to authenticated;
create index jobs_claim on public.jobs(status,available_at);
create index businesses_owner on public.businesses(user_id);
create index private_embeddings_owner on public.private_embeddings(user_id,business_id);
create or replace function public.claim_job() returns setof public.jobs language sql security definer set search_path=public as $$
 update jobs set status='running',attempts=attempts+1,lease_until=now()+interval '10 minutes',progress=5 where id=(select id from jobs where ((status='queued' and available_at<=now()) or (status='running' and lease_until<now())) and attempts<max_attempts order by created_at for update skip locked limit 1) returning *;
$$;
revoke all on function public.claim_job() from public,anon,authenticated;grant execute on function public.claim_job() to service_role;
create or replace function public.match_references(query_embedding extensions.vector(1536),version_filter text,match_count int default 5) returns table(id uuid,content text,page int,url text,title text,version text) language sql stable set search_path=public,extensions as $$
 select c.id,c.content,c.page,v.url,v.title,v.version from reference_chunks c join reference_versions v on v.id=c.version_id where v.version=version_filter and c.embedding is not null order by c.embedding <=> query_embedding limit least(match_count,10);
$$;
revoke all on function public.match_references(extensions.vector,text,int) from public,anon;grant execute on function public.match_references(extensions.vector,text,int) to authenticated,service_role;
create or replace function public.match_private(query_embedding extensions.vector(1536),business_filter uuid,match_count int default 5) returns table(id uuid,content text,location text) language sql stable set search_path=public,extensions as $$
 select e.id,e.content,e.location from private_embeddings e where e.user_id=auth.uid() and e.business_id=business_filter order by e.embedding <=> query_embedding limit least(match_count,10);
$$;
revoke all on function public.match_private(extensions.vector,uuid,int) from public,anon;grant execute on function public.match_private(extensions.vector,uuid,int) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit) values('business-private','business-private',false,26214400) on conflict(id) do update set public=false,file_size_limit=26214400;
-- Storage writes and expiring URLs are created server-side after owner checks.
create or replace function public.enqueue_job(owner_id uuid,business uuid,job_kind text,job_payload jsonb) returns public.jobs language plpgsql security definer set search_path=public as $$
declare result public.jobs;
begin
 perform pg_advisory_xact_lock(hashtext(owner_id::text));
 if not exists(select 1 from businesses where id=business and user_id=owner_id) then raise exception 'Business not found';end if;
 if (select count(*) from jobs where user_id=owner_id and created_at>now()-interval '24 hours')>=100 then raise exception 'Daily processing limit reached';end if;
 insert into jobs(user_id,business_id,kind,payload) values(owner_id,business,job_kind,job_payload) returning * into result;
 return result;
end;$$;
revoke all on function public.enqueue_job(uuid,uuid,text,jsonb) from public,anon,authenticated;grant execute on function public.enqueue_job(uuid,uuid,text,jsonb) to service_role;
grant all on public.businesses,public.conversations,public.uploads,public.extracted_figures,public.assumptions,public.report_versions,public.jobs,public.private_embeddings,public.reference_versions,public.reference_chunks to service_role;
create index reference_vectors on public.reference_chunks using hnsw(embedding extensions.vector_cosine_ops);
create index private_vectors on public.private_embeddings using hnsw(embedding extensions.vector_cosine_ops);
