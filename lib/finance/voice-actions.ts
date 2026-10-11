import { z } from "zod";
import { profileSchema, assumptionsSchema } from "./model";

export const voiceActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update_business"), profile: profileSchema.partial().strict().optional(), assumptions: assumptionsSchema.partial().strict().optional() }).strict(),
  z.object({ action: z.literal("report_settings"), reportType: z.enum(["project", "cma"]).optional(), style: z.enum(["classic", "modern", "consulting"]).optional(), charts: z.boolean().optional() }).strict(),
  z.object({ action: z.enum(["review_report", "show_usage", "show_reports"]) }).strict(),
]);
export const voiceTools = [{
  type: "function", name: "folio_action",
  description: "Update explicitly supplied business facts or report settings, review a report before generation, or show usage/saved reports. Financial amounts are rupees, percentages are numbers. Never invent missing values. review_report opens the required user confirmation; it does not generate a report.",
  parameters: { type: "object", properties: { action: { type: "string", enum: ["update_business", "report_settings", "review_report", "show_usage", "show_reports"] }, profile: { type: "object", description: "Business profile fields such as name, location, industry, products, customers, purpose, lender; string values." }, assumptions: { type: "object", description: "Only explicitly supplied assumptions: annualSales, annualOverheads, loan, capex, ownerContribution as decimal rupee strings; interestPct, tenureMonths, years, growthPct as numbers." }, reportType: { type: "string", enum: ["project", "cma"] }, style: { type: "string", enum: ["classic", "modern", "consulting"] }, charts: { type: "boolean" } }, required: ["action"], additionalProperties: false },
}];
