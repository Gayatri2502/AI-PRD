# Calculation methods

All input amounts use INR rupees and decimal strings. Decimal.js performs calculations at 32-digit precision; monetary outputs round to paise. Report units affect presentation only.

- Project cost = capex + working-capital cash + expensed setup costs. Funding = confirmed owner contribution + new term loan. Totals must agree.
- Sales and overheads grow by explicitly confirmed rates. Direct cost is a confirmed percentage of sales. Depreciation reduces the asset carrying amount; setup costs are expensed in year one.
- Monthly loan: constant EMI after moratorium; monthly interest uses annual rate / 12. Interest-only and capitalised moratoria are supported. The final instalment clears rounding residue. Existing term loans are scheduled separately and aggregated.
- Operating working capital = receivables + inventory + other current operating assets − supplier dues − other current operating liabilities. Cash is excluded from the operating gap. Receivables use sales × days / 365; stock uses direct cost × days / 365; supplier dues use purchases × days / 365. Purchases = cost of sales + closing stock − opening stock.
- PAT = sales − direct costs − overheads − depreciation − expensed interest − tax. Effective tax is applied only to positive profit under this simplified assumption model.
- Cash from operations = PAT + depreciation − increase in operating working capital. Closing cash adds capital and loan receipts and deducts capex, principal and drawings. Depreciation, interest and repayment are not deducted twice.
- Balance sheet rolls forward fixed assets, loans, capital and retained earnings. Capitalised interest increases both assets and debt as a noncash movement.
- Projected current liabilities include the next twelve months of term principal. Historical classifications use supplied figures and require accountant review.
- DSCR = (PAT + depreciation + expensed term interest) / (term principal + expensed term interest). Working-capital interest is not added back. Historical DSCR remains unknown without a term-interest split.
- Break-even sales = (overheads + depreciation) / contribution margin. It is not a cash break-even or a lender benchmark. Ratios with zero denominators remain not applicable.
- Funding, balance-sheet, cash and loan checks must reconcile before generation. Duplicate/nonconsecutive years, mismatched opening accounts and cash shortfalls block generation.

A new loan is not necessarily a new business. Existing businesses supply historical accounts; new businesses supply clearly marked projections. Missing records are never invented.
