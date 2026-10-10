import postgres from 'postgres';import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL||process.env.DATABASE_URL.includes('[YOUR-PASSWORD]'))throw Error('Set the real server-side DATABASE_URL before applying migrations.');
const sql=postgres(process.env.DATABASE_URL,{prepare:false,ssl:'require',max:1});try{await sql.unsafe(await readFile('supabase/migrations/202610100001_lending_workspace.sql','utf8'));console.log('Migration applied.');}finally{await sql.end();}
