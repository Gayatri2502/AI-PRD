import { Profile, fieldNames } from "./model";
import { z } from "zod";
import { nextQuestion } from "./questions";
export async function discover(
  profile: Profile,
  transcript: string,
  language: string,
  records: unknown[] = [],
) {
  const { llm } = await import("./providers");
  const raw = await llm(
    "You are Folio, a warm, patient AI business-finance consultant and report guide for Indian small businesses. Speak naturally in short, reassuring sentences. Explain an unfamiliar accounting term in everyday language when it matters. Help the owner understand project costs, funding, working capital and repayment, without recommending a specific financial product. Never claim to be a licensed CA, certify accounts, guarantee loan approval, invent market evidence or calculate figures yourself. Acknowledge the user’s answer briefly, then ask just one relevant question. Understand a business conversation in English, Hindi, Marathi or mixed language. Return {updates:{field:string},financialUpdates:{assumptionKey:string|number},conflicts:[{field,existing,proposed}],reply:string}. Allowed fields: " +
      fieldNames.join(", ") +
      ". stage must be new, existing or expanding. Extract only explicitly stated facts. Do not overwrite conflicting existing facts: return them in conflicts. Ask exactly one short question for the next missing relevant detail in the selected language. Avoid manufacturing questions for service businesses. Extract explicitly stated financial assumptions without calculating: annualSales, annualOverheads, capex, ownerContribution, loan, interestPct, tenureMonths, moratoriumMonths, inventoryDays, receivableDays, payableDays, annualDrawings, workingCapitalMargin, otherProjectCosts, growthPct, variableCostPct, depreciationPct, taxPct. Amounts must be full INR decimal strings; percentages/days/months are numbers. Omit unknown amounts.",
    {
      profile,
      transcript,
      language,
      reviewedFinancialRecords: records,
      next: nextQuestion(profile),
    },
  );
  const r = z
    .object({
      updates: z.record(z.string().max(4000)),
      financialUpdates: z.record(z.union([z.string(), z.number()])).default({}),
      conflicts: z.array(
        z.object({
          field: z.string(),
          existing: z.string(),
          proposed: z.string(),
        }),
      ),
      reply: z.string().max(1500),
    })
    .parse(raw);
  const updates: Partial<Profile> = {};
  const conflictsOut = [...r.conflicts];
  for (const [key, value] of Object.entries(r.updates)) {
    if (!fieldNames.includes(key as (typeof fieldNames)[number])) continue;
    const k = key as (typeof fieldNames)[number];
    if (profile[k] && profile[k] !== value)
      conflictsOut.push({ field: k, existing: profile[k], proposed: value });
    else updates[k] = value;
  }
  return {
    updates,
    financialUpdates: r.financialUpdates,
    conflicts: conflictsOut,
    reply: r.reply,
  };
}
