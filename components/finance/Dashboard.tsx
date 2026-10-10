"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Mic,
  Square,
  Upload,
  Volume2,
  VolumeX,
  ArrowUpRight,
  FileText,
  FileSpreadsheet,
  Check,
  Loader2,
  LogOut,
} from "lucide-react";
import { browserAuth, uploadPrivateFile } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import {
  initialInput,
  ReportInput,
  labels,
  fieldNames,
  Year,
  yearSchema,
  assumptionsSchema,
} from "@/lib/finance/model";
import { calculate, Calculation } from "@/lib/finance/engine";
import { nextQuestion } from "@/lib/finance/questions";
import { sections } from "@/lib/finance/sections";
type Row = { id: string; [key: string]: any };
export default function Dashboard() {
  const [data, setData] = useState<ReportInput>(structuredClone(initialInput)),
    [business, setBusiness] = useState<Row | null>(null),
    [messages, setMessages] = useState<Row[]>([]),
    [uploads, setUploads] = useState<Row[]>([]),
    [figures, setFigures] = useState<Row[]>([]),
    [jobs, setJobs] = useState<Row[]>([]),
    [reports, setReports] = useState<Row[]>([]),
    [text, setText] = useState(""),
    [language, setLanguage] = useState("English"),
    [consent, setConsent] = useState(false),
    [muted, setMuted] = useState(true),
    [recording, setRecording] = useState(false),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(""),
    [review, setReview] = useState(false),
    [preview, setPreview] = useState<Calculation | null>(null),
    [conversationResult, setConversationResult] = useState<Row | null>(null);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    chunks = useRef<Blob[]>([]),
    dirty = useRef(false),
    handled = useRef(new Set<string>()),
    businessRef = useRef<Row | null>(null);
  const loading = useRef(false);
  const saveInFlight = useRef(false),
    latestData = useRef(data);
  latestData.current = data;
  const patch = (next: ReportInput) => {
    setData({ ...next, confirmed: false });
    dirty.current = true;
  };
  async function api(body: unknown) {
    const r = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw Error(j.error || "Request failed");
    return j;
  }
  async function load(initial = false) {
    if (loading.current) return;
    loading.current = true;
    try {
      const r = await fetch("/api/workspace", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw Error(j.error);
      let b = j.business;
      if (!b && initial) b = await api({ action: "create" });
      if (b) {
        if (initial) {
          setData({ ...initialInput, ...b.data });
          setBusiness(b);
          businessRef.current = b;
        }
        setMessages(j.conversations || []);
        setUploads(j.uploads || []);
        setFigures(j.figures || []);
        setReports(j.reports || []);
        setJobs(j.jobs || []);
        for (const job of j.jobs || []) {
          if (job.status === "succeeded" && !handled.current.has(job.id)) {
            handled.current.add(job.id);
            if (job.kind === "conversation") setConversationResult(job.result);
            if (job.kind === "transcribe") setText(job.result.transcript);
          }
        }
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to load workspace");
    } finally {
      loading.current = false;
    }
  }
  useEffect(() => {
    void load(true);
    const timer = setInterval(() => void load(), 4000);
    return () => {
      clearInterval(timer);
      stream.current?.getTracks().forEach((t) => t.stop());
      speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    if (!dirty.current || !businessRef.current) return;
    const timer = setTimeout(() => void save(), 1000);
    return () => clearTimeout(timer);
  }, [data]);
  async function save() {
    if (!businessRef.current || saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      while (dirty.current) {
        const b = businessRef.current!,
          snapshot = latestData.current;
        setSaved("Saving…");
        const next = await api({
          action: "save",
          businessId: b.id,
          revision: b.revision,
          data: snapshot,
        });
        businessRef.current = next;
        setBusiness(next);
        dirty.current = latestData.current !== snapshot;
        setSaved("Saved privately");
      }
    } catch (e) {
      setSaved("Not saved");
      dirty.current = false;
      setNotice(e instanceof Error ? e.message : "Save failed");
    } finally {
      saveInFlight.current = false;
    }
  }
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    await action(async () => {
      if (!business)
        throw Error("Sign in to a configured Firebase workspace first.");
      if (dirty.current) await save();
      await api({
        action: "conversation",
        businessId: business.id,
        transcript: text,
        language,
        consent,
      });
      setText("");
      await load();
    });
  }
  async function uploadFiles(
    files: FileList | File[] | null,
    kind = "financial",
  ) {
    if (!files) return;
    await action(async () => {
      if (!business) throw Error("Sign in to upload private files.");
      if (Array.from(files).length > 20)
        throw Error("Upload at most 20 files at a time.");
      for (const file of Array.from(files)) {
        const item = await api({
          action: "prepare-upload",
          businessId: business.id,
          name: file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
          kind,
        });
        await uploadPrivateFile(item.path, file);
        await api({
          action: "process-upload",
          businessId: business.id,
          uploadId: item.uploadId,
          consent,
        });
      }
      setNotice("Files uploaded. Processing jobs will show progress below.");
      await load();
    });
  }
  async function record() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    await action(async () => {
      if (!consent)
        throw Error(
          "Enable external processing before recording for transcription.",
        );
      if (!navigator.mediaDevices || !window.MediaRecorder)
        throw Error(
          "Recording is not supported here. Upload a voice note instead.",
        );
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      chunks.current = [];
      const r = new MediaRecorder(stream.current);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        const type = r.mimeType;
        const file = new File(
          chunks.current,
          [`voice-${Date.now()}.${type.includes("mp4") ? "mp4" : "webm"}`].join(
            "",
          ),
          { type },
        );
        void uploadFiles([file], "audio");
      };
      r.start();
      setRecording(true);
      setTimeout(() => {
        if (r.state === "recording") {
          r.stop();
          setRecording(false);
        }
      }, 180000);
    });
  }
  function speak() {
    const q = conversationResult?.reply || nextQuestion(data.profile).question;
    if (!muted && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(q);
      utterance.lang =
        language === "Hindi"
          ? "hi-IN"
          : language === "Marathi"
            ? "mr-IN"
            : "en-IN";
      speechSynthesis.speak(utterance);
    }
  }
  useEffect(() => {
    speak();
  }, [conversationResult, muted]);
  function confirm() {
    const parsed = calculate({ ...data, confirmed: true });
    if (parsed.issues.length) throw Error(parsed.issues.join("\n"));
    setPreview(parsed);
    setReview(true);
  }
  async function generate() {
    await action(async () => {
      if (!business) throw Error("Sign in before generating saved reports.");
      await api({
        action: "generate",
        businessId: business.id,
        data: { ...data, confirmed: true },
        consent,
      });
      setReview(false);
      setPreview(null);
      setNotice("Report queued. Keep working; progress appears below.");
      await load();
    });
  }
  function numeric(key: string, value: string) {
    patch({
      ...data,
      assumptions: {
        ...data.assumptions,
        [key]:
          typeof data.assumptions[key as keyof typeof data.assumptions] ===
          "number"
            ? value === ""
              ? NaN
              : Number(value)
            : value,
      },
    });
  }
  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/">
          Folio<span>Finance</span>
        </Link>
        <div className="header-end">
          <span className="save-state">{saved}</span>
          <Link href="/login">Sign in</Link>
          <button
            className="icon-btn"
            aria-label="Sign out"
            onClick={() =>
              void action(async () => {
                await fetch("/api/auth/session", { method: "DELETE" });
                await signOut(browserAuth());
                location.assign("/login");
              })
            }
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main id="main-content" className="workspace">
        <div className="workspace-title">
          <div>
            <p className="eyebrow">BUSINESS REPORT SERVICES / WORKSPACE</p>
            <h1>Prepare your business report</h1>
            <p>
              Provide business details, verify financial information and
              generate your report.
            </p>
          </div>
          <span className="draft-pill">Drafts for review</span>
        </div>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        <div className="dashboard-grid">
          <section className="panel assistant-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">STEP 01 · BUSINESS DETAILS</p>
                <h2>Business information assistant</h2>
              </div>
              <button
                aria-label={
                  muted ? "Unmute spoken responses" : "Mute spoken responses"
                }
                className="icon-btn"
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeX /> : <Volume2 />}
              </button>
            </div>
            <div className="voice-zone">
              <div className="voice-rings">
                <button
                  className={"record " + (recording ? "recording" : "")}
                  disabled={busy}
                  onClick={() => void record()}
                  aria-label={recording ? "Stop recording" : "Start recording"}
                >
                  {recording ? <Square size={28} /> : <Mic size={34} />}
                </button>
              </div>
              <h3>
                {recording
                  ? "Listening… tap to finish"
                  : "Start with your own words"}
              </h3>
              <p>“I run a small business in Pune and need a loan to expand.”</p>
              <div className="voice-controls">
                <select
                  aria-label="Conversation language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {["English", "Hindi", "Marathi", "Mixed"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <label className="file-label">
                  <Upload size={14} /> Voice note
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => void uploadFiles(e.target.files, "audio")}
                  />
                </label>
              </div>
              <small>
                Up to 3 minutes per recording. Spoken responses use available
                device voices.
              </small>
            </div>
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I allow external AI processing of my audio, messages and
                uploaded records for transcription, OCR and extraction. Files
                stay private in this workspace; the configured provider’s
                retention terms apply.
              </span>
            </label>
            <div className="conversation" aria-live="polite">
              <div className="bubble assistant">
                <span>FOLIO ASSISTANT</span>
                <p>{nextQuestion(data.profile).question}</p>
              </div>
              {messages.map((m) => (
                <div key={m.id} className={"bubble " + m.role}>
                  <span>
                    {m.role === "user" ? "YOUR NOTES" : "FOLIO ASSISTANT"}
                  </span>
                  {m.role === "user" ? (
                    <textarea
                      aria-label="Editable transcript"
                      defaultValue={m.content}
                      onBlur={(e) => {
                        if (e.target.value !== m.content)
                          void action(async () => {
                            await api({
                              action: "edit-transcript",
                              businessId: business?.id,
                              messageId: m.id,
                              content: e.target.value,
                            });
                            setText(e.target.value);
                            setNotice(
                              "Transcript corrected. Send the edited text to update the business summary.",
                            );
                          });
                      }}
                    />
                  ) : (
                    <p>{m.content}</p>
                  )}
                </div>
              ))}
            </div>
            {conversationResult && (
              <div className="notice">
                <p>
                  Assistant found{" "}
                  {Object.keys(conversationResult.updates || {}).length} new
                  business details. Review all suggested financial assumptions
                  before accepting.
                </p>
                <pre className="prewrap">
                  {JSON.stringify(
                    conversationResult.financialUpdates || {},
                    null,
                    2,
                  )}
                </pre>
                <button
                  className="secondary"
                  onClick={() => {
                    const candidate = { ...data.assumptions };
                    for (const [key, value] of Object.entries(
                      conversationResult.financialUpdates || {},
                    )) {
                      const shape =
                        assumptionsSchema.shape[
                          key as keyof typeof assumptionsSchema.shape
                        ];
                      if (
                        shape &&
                        key !== "opening" &&
                        key !== "existingLoans" &&
                        shape.safeParse(value).success
                      ) {
                        (candidate as any)[key] = value;
                      }
                    }
                    patch({
                      ...data,
                      profile: {
                        ...data.profile,
                        ...conversationResult.updates,
                      },
                      assumptions: candidate,
                    });
                    setConversationResult(null);
                  }}
                >
                  Use these details
                </button>
                {conversationResult.conflicts?.map((x: any, n: number) => (
                  <p key={n}>
                    Conflict in {x.field}: “{x.existing}” / “{x.proposed}”.
                    Correct this in the business summary.
                  </p>
                ))}
              </div>
            )}
            <div className="reply">
              <label className="sr-only" htmlFor="reply">
                Type or correct your reply
              </label>
              <textarea
                id="reply"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a reply, or edit your transcribed voice note…"
              />
              <button
                className="primary"
                disabled={busy || !text.trim()}
                onClick={() => void send()}
              >
                Send <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
          <section className="panel report-panel">
            <p className="eyebrow">STEP 02 · DOCUMENT PREPARATION</p>
            <h2>Report application</h2>
            <div className="report-selector">
              {(["project", "cma"] as const).map((type) => (
                <button
                  key={type}
                  className={data.reportType === type ? "selected" : ""}
                  onClick={() => patch({ ...data, reportType: type })}
                >
                  {type === "project" ? <FileText /> : <FileSpreadsheet />}
                  <strong>
                    {type === "project" ? "Project Report" : "CMA Report"}
                  </strong>
                  <small>
                    {type === "project"
                      ? "Your plan, investment & projections"
                      : "Accounts, working capital & ratios"}
                  </small>
                  {data.reportType === type && <Check size={16} />}
                </button>
              ))}
            </div>
            <div className="upload-zone">
              <Upload size={24} />
              <h3>Add your financial records</h3>
              <p>
                Accounts, GST, ITRs, bank statements, loan schedules and
                quotations.
              </p>
              <div>
                <label className="secondary file-label">
                  Choose files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png"
                    onChange={(e) => void uploadFiles(e.target.files)}
                  />
                </label>
                <label className="text-link file-label">
                  Upload folder
                  <input
                    type="file"
                    multiple
                    {...({ webkitdirectory: "", directory: "" } as any)}
                    onChange={(e) => void uploadFiles(e.target.files)}
                  />
                </label>
              </div>
              <small>PDF, images, Word, Excel or CSV · 25 MB per file</small>
            </div>
            {uploads.map((f) => (
              <div className="file-row" key={f.id}>
                <FileText size={16} />
                <span>{f.name}</span>
                <small>{f.status}</small>
                {f.format_guidance && (
                  <button
                    className="text-link"
                    title={f.format_guidance.reason}
                    onClick={() =>
                      patch({
                        ...data,
                        style: f.format_guidance.recommendedStyle,
                      })
                    }
                  >
                    Use suggested {f.format_guidance.recommendedStyle} style
                  </button>
                )}
              </div>
            ))}
            <label>
              Report style
              <select
                value={data.style}
                onChange={(e) =>
                  patch({
                    ...data,
                    style: e.target.value as ReportInput["style"],
                  })
                }
              >
                <option value="classic">Classic banking tables</option>
                <option value="modern">Clean modern financial report</option>
                <option value="consulting">
                  Professional consulting report
                </option>
              </select>
            </label>
            <details>
              <summary>Optional report settings</summary>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={data.charts}
                  onChange={(e) => patch({ ...data, charts: e.target.checked })}
                />{" "}
                Include charts
              </label>
              <label>
                Projection period
                <select
                  value={data.assumptions.years}
                  onChange={(e) => numeric("years", e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((x) => (
                    <option key={x} value={x}>
                      {x} years
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reporting units
                <select
                  value={data.units}
                  onChange={(e) =>
                    patch({
                      ...data,
                      units: e.target.value as ReportInput["units"],
                    })
                  }
                >
                  {["rupees", "lakhs", "crores"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Lender-specific requirements
                <textarea
                  value={data.lenderRequirements}
                  onChange={(e) =>
                    patch({ ...data, lenderRequirements: e.target.value })
                  }
                  placeholder="Add the bank’s current requirements and source."
                />
              </label>
              <label className="file-label text-link">
                Upload an optional formatting sample
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx"
                  onChange={(e) => void uploadFiles(e.target.files, "style")}
                />
              </label>
              <small>
                We suggest an original style based on the sample’s structure. No
                sample figures, branding or signatures are copied.
              </small>
              <label>
                Lending assessment method
                <select
                  value={data.lendingAssessment.method}
                  onChange={(e) =>
                    patch({
                      ...data,
                      lendingAssessment: {
                        ...data.lendingAssessment,
                        method: e.target.value as any,
                        confirmed: false,
                      },
                    })
                  }
                >
                  <option value="none">No verified lender method</option>
                  <option value="turnover">
                    Lender percentage of turnover
                  </option>
                  <option value="working-capital-gap">
                    Lender percentage of working capital gap
                  </option>
                </select>
              </label>
              {data.lendingAssessment.method !== "none" && (
                <>
                  <label>
                    Lender percentage
                    <input
                      type="number"
                      value={data.lendingAssessment.ratePct}
                      onChange={(e) =>
                        patch({
                          ...data,
                          lendingAssessment: {
                            ...data.lendingAssessment,
                            ratePct: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    Source reference
                    <input
                      value={data.lendingAssessment.source}
                      onChange={(e) =>
                        patch({
                          ...data,
                          lendingAssessment: {
                            ...data.lendingAssessment,
                            source: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={data.lendingAssessment.confirmed}
                      onChange={(e) =>
                        patch({
                          ...data,
                          lendingAssessment: {
                            ...data.lendingAssessment,
                            confirmed: e.target.checked,
                          },
                        })
                      }
                    />{" "}
                    I checked this method against my lender’s requirements
                  </label>
                </>
              )}
            </details>
            <details open>
              <summary>Business summary</summary>
              <p className="quiet">
                Correct the details gathered from your conversation.
              </p>
              <div className="form-grid">
                {fieldNames
                  .filter(
                    (k) =>
                      k !== "capacity" ||
                      !/service/i.test(data.profile.industry),
                  )
                  .map((k) => (
                    <label key={k}>
                      {k === "stage"
                        ? "Business stage"
                        : k.replace(/([A-Z])/g, " $1")}
                      {k === "stage" ? (
                        <select
                          value={data.profile[k]}
                          onChange={(e) =>
                            patch({
                              ...data,
                              profile: { ...data.profile, [k]: e.target.value },
                            })
                          }
                        >
                          <option value="">Choose</option>
                          <option value="new">New business</option>
                          <option value="existing">Existing business</option>
                          <option value="expanding">Expanding business</option>
                        </select>
                      ) : (
                        <input
                          value={data.profile[k]}
                          onChange={(e) =>
                            patch({
                              ...data,
                              profile: { ...data.profile, [k]: e.target.value },
                            })
                          }
                        />
                      )}
                    </label>
                  ))}
              </div>
            </details>
            <details>
              <summary>
                Financial assumptions · review before generating
              </summary>
              <p className="quiet">
                Enter full INR rupees. A blank is unknown. Enter 0 only when you
                have confirmed there is none. Percentage and cycle defaults must
                be reviewed.
              </p>
              <div className="form-grid">
                <label>
                  First projected financial year
                  <input
                    type="number"
                    value={data.assumptions.startYear}
                    onChange={(e) => numeric("startYear", e.target.value)}
                  />
                </label>
                {Object.entries(labels)
                  .filter(([k]) => k in data.assumptions)
                  .filter(
                    ([k]) =>
                      k !== "inventoryDays" ||
                      !/service/i.test(data.profile.industry),
                  )
                  .map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        step="any"
                        value={
                          Number.isNaN(
                            data.assumptions[
                              key as keyof typeof data.assumptions
                            ],
                          )
                            ? ""
                            : String(
                                data.assumptions[
                                  key as keyof typeof data.assumptions
                                ],
                              )
                        }
                        onChange={(e) => numeric(key, e.target.value)}
                      />
                    </label>
                  ))}
                <label>
                  Moratorium interest
                  <select
                    value={data.assumptions.moratorium}
                    onChange={(e) =>
                      patch({
                        ...data,
                        assumptions: {
                          ...data.assumptions,
                          moratorium: e.target.value as any,
                        },
                      })
                    }
                  >
                    <option value="interest-only">
                      Pay interest during moratorium
                    </option>
                    <option value="capitalised">
                      Add interest to asset cost and debt
                    </option>
                  </select>
                </label>
              </div>
              <h3>Existing term loans</h3>
              {(data.assumptions.existingLoans || []).map((loan, index) => (
                <div className="form-grid" key={index}>
                  {Object.entries(loan).map(([key, v]) => (
                    <label key={key}>
                      {key}
                      <input
                        type={key === "name" ? "text" : "number"}
                        value={v}
                        onChange={(e) => {
                          const loans = [...data.assumptions.existingLoans];
                          loans[index] = {
                            ...loan,
                            [key]:
                              key === "name" || key === "balance"
                                ? e.target.value
                                : Number(e.target.value),
                          };
                          patch({
                            ...data,
                            assumptions: {
                              ...data.assumptions,
                              existingLoans: loans,
                            },
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>
              ))}
              <button
                className="secondary"
                onClick={() =>
                  patch({
                    ...data,
                    assumptions: {
                      ...data.assumptions,
                      existingLoans: [
                        ...(data.assumptions.existingLoans || []),
                        {
                          name: "",
                          balance: "",
                          interestPct: 0,
                          remainingMonths: 12,
                        },
                      ],
                    },
                  })
                }
              >
                Add existing term loan
              </button>
              <h3>Opening balance sheet</h3>
              <p className="quiet">
                For a new business, confirm each opening amount. For an existing
                business, use the latest year-end balances.
              </p>
              <div className="form-grid">
                {Object.entries(data.assumptions.opening).map(([k, v]) => (
                  <label key={k}>
                    {labels[k]}
                    <input
                      type="number"
                      step=".01"
                      value={v}
                      onChange={(e) =>
                        patch({
                          ...data,
                          assumptions: {
                            ...data.assumptions,
                            opening: {
                              ...data.assumptions.opening,
                              [k]: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </details>
            <details>
              <summary>
                Historical accounts{" "}
                {data.historical.length
                  ? `· ${data.historical.length} years`
                  : ""}
              </summary>
              <p className="quiet">
                Only enter figures from real accounts. Do not use projections as
                historical figures.
              </p>
              {data.historical.map((year, index) => (
                <details key={index}>
                  <summary>
                    FY {year.year} · {year.status}
                  </summary>
                  <div className="form-grid">
                    {Object.entries(year).map(([key, v]) => (
                      <label key={key}>
                        {labels[key] || key}
                        {key === "status" ? (
                          <select
                            value={v}
                            onChange={(e) => {
                              const h = [...data.historical];
                              h[index] = {
                                ...year,
                                status: e.target.value as Year["status"],
                              };
                              patch({ ...data, historical: h });
                            }}
                          >
                            {["actual", "provisional", "estimated"].map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            step="any"
                            value={v}
                            onChange={(e) => {
                              const h = [...data.historical];
                              h[index] = {
                                ...year,
                                [key]:
                                  key === "year"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              };
                              patch({ ...data, historical: h });
                            }}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </details>
              ))}
              <button
                className="secondary"
                onClick={() => {
                  const year = Object.fromEntries(
                    Object.keys(yearSchema.shape).map((k) => [
                      k,
                      k === "year"
                        ? data.assumptions.startYear -
                          data.historical.length -
                          1
                        : k === "status"
                          ? "actual"
                          : "",
                    ]),
                  ) as Year;
                  patch({ ...data, historical: [...data.historical, year] });
                }}
              >
                Add financial year
              </button>
            </details>
            {figures.length > 0 && (
              <details open>
                <summary>Review extracted figures</summary>
                <p className="quiet">
                  Check each source and copy accepted figures into the
                  assumptions or historical accounts above. Conflicting versions
                  stay visible.
                </p>
                {figures.map((f) => (
                  <div className="extracted" key={f.id}>
                    <strong>
                      {f.data.label}: {f.data.value ?? "Unknown"} {f.data.unit}
                    </strong>
                    <small>
                      {f.data.year} · {f.data.status} ·{" "}
                      {Math.round(f.data.confidence * 100)}% extraction
                      confidence
                    </small>
                    <p>
                      {f.data.file} · {f.data.location}
                      <br />“{f.data.quote}”
                    </p>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={f.reviewed}
                        onChange={(e) =>
                          void action(async () => {
                            await api({
                              action: "review-figure",
                              businessId: business?.id,
                              figureId: f.id,
                              reviewed: e.target.checked,
                            });
                            if (e.target.checked)
                              patch({
                                ...data,
                                sources: [
                                  ...data.sources,
                                  {
                                    file: f.data.file,
                                    location: f.data.location,
                                    description: f.data.label,
                                  },
                                ],
                              });
                            await load();
                          })
                        }
                      />{" "}
                      Reviewed against source
                    </label>
                  </div>
                ))}
              </details>
            )}
            <button
              className="primary generate"
              disabled={busy}
              onClick={() => {
                try {
                  confirm();
                } catch (e) {
                  setNotice(
                    e instanceof Error
                      ? e.message
                      : "Complete the required inputs.",
                  );
                }
              }}
            >
              Review & generate report <ArrowUpRight size={18} />
            </button>
            <small>
              Calculations are deterministic. Confirm all inputs before
              generation.
            </small>
          </section>
        </div>
        <section className="panel saved-panel">
          <div className="panel-heading">
            <h2>Your reports & processing</h2>
            <span className="quiet">All in one workspace</span>
          </div>
          {!jobs.length && !reports.length && (
            <p className="quiet">
              Your saved reports and processing progress will appear here.
            </p>
          )}
          {jobs
            .filter((j) => j.status !== "succeeded")
            .map((j) => (
              <div className="job-row" key={j.id}>
                <Loader2 size={16} />
                <span>
                  {j.kind} · {j.status} · {j.progress}%<small>{j.error}</small>
                </span>
                {j.status === "failed" && (
                  <button
                    className="secondary"
                    onClick={() =>
                      void action(async () => {
                        await api({
                          action: "retry",
                          businessId: business?.id,
                          jobId: j.id,
                        });
                        await load();
                      })
                    }
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
          {reports.map((r) => (
            <div className="job-row" key={r.id}>
              <FileText />
              <span>
                {r.type === "cma" ? "CMA Report" : "Business Project Report"}
                <small>{new Date(r.created_at).toLocaleString()}</small>
              </span>
              <button
                className="text-link"
                onClick={() => {
                  setPreview(r.calculation);
                  setReview(false);
                }}
              >
                Preview
              </button>
              {["pdf", "docx", "xlsx"].map((format) => (
                <a
                  key={format}
                  className="secondary"
                  href={`/api/workspace/download?id=${r.id}&format=${format}`}
                >
                  {format.toUpperCase()}
                </a>
              ))}
            </div>
          ))}
        </section>
        {preview && (
          <div className="modal-backdrop">
            <section
              className="preview-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Report review"
            >
              <div className="panel-heading">
                <h2>
                  {review ? "Confirm before generating" : "Report preview"}
                </h2>
                <button className="secondary" onClick={() => setPreview(null)}>
                  Close
                </button>
              </div>
              <p className="notice">
                Review the business summary, periods, units, financial
                assumptions and source records. This report carries no CA
                certification or lender approval.
              </p>
              {sections(preview).map((s, n) => (
                <section key={n}>
                  <h3>{s.title}</h3>
                  {s.text && <p className="prewrap">{s.text}</p>}
                  {s.rows && (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            {s.headers?.map((x, j) => (
                              <th key={j}>{x}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.rows.map((r, j) => (
                            <tr key={j}>
                              {r.map((x, k) => (
                                <td key={k}>{x}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
              {review && (
                <button
                  className="primary generate"
                  disabled={busy}
                  onClick={() => void generate()}
                >
                  I confirm these inputs and assumptions · Generate
                </button>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
