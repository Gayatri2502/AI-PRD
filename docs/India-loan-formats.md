# India business loan formats

Research: 7 October 2026. Implementation and verification: 10 October 2026.

Folio now includes eight original borrower-prepared formats. These are informed by public lender examples, not replicas or bank-approved forms. Select the lender's current prescribed application when submitting a real request.

| Format | Detailed intake and output |
|---|---|
| MSME loan application brief | Entity, facility request, existing borrowing, security and financial schedules |
| Business loan project report | Project narrative, costs, funding, equipment, projections, assumptions, implementation and risks |
| Working capital request | Operating cycle, current assets and liabilities, requested facility and supporting assumptions |
| Credit limit renewal/enhancement | Existing and requested limits, updated performance, reasons and changes |
| Promoter profile | Experience, responsibilities, contribution and business interests |
| Personal assets/liabilities | Dated asset and debt schedules, explicit no-liabilities choice and calculated net position |
| Submission checklist | Evidence status, missing items and responsibility |
| Loan offer/KFS review worksheet | Recorded lender disclosures and questions; does not issue a KFS |

## Sources

- [SBI forms hub](https://sbi.bank.in/web/business/information/forms): separate application bands, supporting checklist, appendices and sample KFS. Template screens link to the relevant original PDFs.
- [Bank of Baroda MSME loans](https://bankofbaroda.bank.in/business-banking/msme-banking/loans-and-advances): lending context and supporting documentation.
- [PNB borrower resources](https://www.pnbindia.in/For-Borrowers.html): additional lender forms for comparison.

Lender, facility, amount and legal entity change the required documents. The application therefore records evidence and missing information rather than inventing it. Identity records, bank statements, certificates, valuations, sanctions and KFS must come from their genuine issuers.

## Implemented checks

- Grouped adaptive forms and repeatable financial schedules, up to 50 rows.
- INR amounts in full rupees; decimal precision checks and integer-paise totals.
- Project costs must reconcile with funding; enhancement must exceed the current limit.
- Required fields, valid calendar dates, India jurisdiction and conditional collateral validation on client and server.
- Missing values remain marked for confirmation, never silently treated as Nil.
- Structured tables preserved in preview, HTML, Word and PDF. Small PDF tables stay together; long schedules need further pagination testing and repeated PDF table headers.
- AI may polish selected narrative fields. It cannot replace financial schedule cells; numeric changes in returned narrative are rejected.

## Verification and remaining scope

12 automated tests and TypeScript validation passed. Production build passed. A fictional project report was exported through the application and visually inspected. No live AI output was tested because the provider key is absent.

Next coverage: lender-specific CMA schedules, stock statements, disbursement requests, security documentation and professionally reviewed agreements. Existing non-banking templates have not received this same source-by-source research. Full bank acceptance, all document variants, multilingual PDF fonts and long-table pagination are not yet verified.
