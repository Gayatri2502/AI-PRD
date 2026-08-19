export type AppRole = "USER" | "ADMIN";
export type AppUser = { id: string; email: string; name?: string | null; role: AppRole };
