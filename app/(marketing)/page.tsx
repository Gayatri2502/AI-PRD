import HowItWorks from "@/components/finance/HowItWorks";
import Link from "next/link";
import {
  ArrowUpRight,
  Mic,
  FileSpreadsheet,
  FileText,
  Check,
  FolderOpen,
  Download,
  MessageSquare,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="glass-landing">
      <header className="topbar">
        <Link className="brand" href="/">
          Folio<span>Finance</span>
        </Link>
        <nav aria-label="Main navigation">
          <a className="landing-nav-link" href="#reports">
            Reports
          </a>
          <a className="landing-nav-link" href="#how-it-works">
            How it works
          </a>
          <Link href="/login">Sign in</Link>
          <Link className="primary small" href="/signup">
            Get started <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main id="main-content" className="landing">
        <section className="glass-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">FINANCIAL REPORTS, MADE APPROACHABLE</p>
            <h1 id="hero-title">
              Your business.
              <br />
              Your plans.
              <br />
              <em>Clearly presented.</em>
            </h1>
            <p className="intro">
              Turn your business story and financial records into a Business
              Project Report or CMA Report. Folio helps you organise the
              details, review the numbers and prepare documents for your lending
              conversation.
            </p>
            <div className="hero-actions">
              <Link className="primary" href="/dashboard">
                Prepare a report <ArrowUpRight size={18} />
              </Link>
              <a className="secondary" href="#how-it-works">
                See how it works
              </a>
            </div>
            <p className="language-note">
              <Mic size={16} /> Speak or type in English, Hindi or Marathi.
            </p>
          </div>
          <div
            className="report-window"
            aria-label="Illustration of the report preparation workflow"
          >
            <div className="window-heading">
              <span className="window-dot" /> YOUR REPORT WORKSPACE{" "}
              <span className="preview-tag">Illustration</span>
            </div>
            <div className="illustration-note">
              <MessageSquare size={20} />
              <p>
                “I want to expand my business.
                <br />
                Help me prepare a loan report.”
              </p>
            </div>
            <div className="illustration-document">
              <div className="document-icon">
                <FileText size={24} />
              </div>
              <p className="eyebrow">BUSINESS PROJECT REPORT</p>
              <h2>
                A plan you can
                <br />
                put on paper.
              </h2>
              <div className="document-lines" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="document-check">
                <Check size={16} /> Business & promoter profile
              </div>
              <div className="document-check">
                <Check size={16} /> Investment & funding plan
              </div>
              <div className="document-check">
                <Check size={16} /> Financial projections
              </div>
              <div className="document-status">
                Draft · Confirm inputs before generation
              </div>
            </div>
            <div className="export-strip">
              <span>Take your work with you</span>
              <strong>PDF</strong>
              <strong>DOCX</strong>
              <strong>XLSX</strong>
            </div>
          </div>
        </section>
        <div className="capability-strip">
          <span>
            <Mic size={18} /> Voice or typed replies
          </span>
          <span>
            <FolderOpen size={18} /> Financial document uploads
          </span>
          <span>
            <FileSpreadsheet size={18} /> Traceable calculations
          </span>
          <span>
            <Download size={18} /> Three export formats
          </span>
        </div>
        <section
          id="reports"
          className="landing-section"
          aria-labelledby="reports-heading"
        >
          <p className="eyebrow">TWO REPORTS. ONE WORKSPACE.</p>
          <h2 id="reports-heading">Choose the report your business needs.</h2>
          <p className="section-intro">
            For new ventures, existing businesses and expansion plans. Start
            with your purpose, then review the details that matter to your
            lender.
          </p>
          <div className="report-pair">
            <article>
              <FileText />
              <span>01 / BUSINESS PLANNING</span>
              <h3>Business Project Report</h3>
              <p>
                Explain what your business does, what you plan to invest and how
                you expect to repay the borrowing.
              </p>
              <ul>
                <li>Business overview and promoter experience</li>
                <li>Operations, project cost and means of finance</li>
                <li>Projections, repayment assessment and risks</li>
                <li>Assumptions and supporting-document references</li>
              </ul>
              <Link className="text-link" href="/dashboard">
                Prepare a Project Report <ArrowUpRight size={15} />
              </Link>
            </article>
            <article>
              <FileSpreadsheet />
              <span>02 / FINANCIAL ASSESSMENT</span>
              <h3>CMA Report</h3>
              <p>
                Organise historical accounts and projections into schedules for
                a business credit assessment.
              </p>
              <ul>
                <li>Operating statements and balance sheets</li>
                <li>Working capital, funds flow and cash flow</li>
                <li>Financial ratios and loan repayment schedules</li>
                <li>Lender requirements where verified</li>
              </ul>
              <Link className="text-link" href="/dashboard">
                Prepare a CMA Report <ArrowUpRight size={15} />
              </Link>
            </article>
          </div>
        </section>
        <HowItWorks />
        <section
          className="information-panel"
          aria-labelledby="control-heading"
        >
          <div>
            <p className="eyebrow">CLEAR INPUTS. CONSIDERED OUTPUTS.</p>
            <h2 id="control-heading">Keep control of your numbers.</h2>
            <p>
              Folio uses calculation code for financial schedules and AI to help
              understand your information. Missing figures stay unknown until
              you supply or confirm them.
            </p>
          </div>
          <ul>
            <li>
              <Check size={18} />
              <span>
                <strong>Review before generating</strong>Check business details,
                financial years, units and assumptions.
              </span>
            </li>
            <li>
              <Check size={18} />
              <span>
                <strong>Your preferred presentation</strong>Choose classic
                banking, modern financial or consulting styles.
              </span>
            </li>
            <li>
              <Check size={18} />
              <span>
                <strong>Permission before AI processing</strong>Audio and
                private records are sent to configured external providers only
                after your consent.
              </span>
            </li>
          </ul>
        </section>
        <section className="landing-faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Before you begin</h2>
          <details>
            <summary>What should I have ready?</summary>
            <p>
              Start with your business details, planned investment, own
              contribution and borrowing requirement. Existing businesses should
              also have their actual accounts. You can add PDF, image, Word,
              Excel and CSV records as you work.
            </p>
          </details>
          <details>
            <summary>Can I use Folio for a new business?</summary>
            <p>
              Yes. A new business can prepare clearly labelled projections using
              assumptions you review and confirm. Folio does not invent
              historical accounts or market evidence.
            </p>
          </details>
          <details>
            <summary>Does a report guarantee a loan?</summary>
            <p>
              No. Reports are drafts for review, not CA certifications or lender
              approvals. Each lender makes its own credit decision and may
              request additional documents or a specific format.
            </p>
          </details>
        </section>
        <section className="landing-cta">
          <div>
            <h2>Give your next business step a clear plan.</h2>
            <p>Bring your ideas and records together in one workspace.</p>
          </div>
          <Link className="primary" href="/dashboard">
            Open workspace <ArrowUpRight size={18} />
          </Link>
        </section>
        <footer>
          <span>
            Folio Finance · Independent business report preparation platform.
          </span>
          <span>
            Reports require review. No CA certification or loan sanction
            guarantee.
          </span>
        </footer>
      </main>
    </div>
  );
}
