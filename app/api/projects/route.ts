import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";

const demoProjects = [
  { id: "demo", name: "AI PRD Demo", description: "A local demo project that works without Supabase or PostgreSQL.", status: "ACTIVE", updatedAt: new Date().toISOString() }
];

export async function GET() {
  if (!isSupabaseServerConfigured()) return NextResponse.json({ projects: demoProjects, demoMode: true });
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { supabaseUserId: data.user.id }, include: { projects: true } });
  return NextResponse.json({ projects: user?.projects ?? [] });
}

export async function POST(request: Request) {
  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ id: "demo", ...parsed.data, status: "ACTIVE", demoMode: true }, { status: 201 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.upsert({ where: { supabaseUserId: data.user.id }, update: { email: data.user.email ?? "" }, create: { supabaseUserId: data.user.id, email: data.user.email ?? "unknown@example.com" } });
  const project = await db.project.create({ data: { ...parsed.data, ownerId: user.id, prds: { create: { title: parsed.data.name, content: `# ${parsed.data.name}\n\n${parsed.data.description}` } }, activityLogs: { create: { action: "project.created", userId: user.id } } } });
  return NextResponse.json(project, { status: 201 });
}
