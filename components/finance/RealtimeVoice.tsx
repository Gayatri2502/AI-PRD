"use client";
import { useEffect, useRef, useState } from "react";
import FolioCharacter from "./FolioCharacter";
import { readJSON } from "@/lib/http";

export default function RealtimeVoice({ businessId, consent, language, onComplete, onAction }: {
  businessId: string; consent: boolean; language: string; onComplete: (transcript: string) => void; onAction: (action: unknown) => Promise<unknown>;
}) {
  const actionRef = useRef(onAction); actionRef.current = onAction;
  const [hasStarted, setHasStarted] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [phase, setPhase] = useState("idle"), [reply, setReply] = useState(""), [error, setError] = useState(""), [selectedLanguage, setSelectedLanguage] = useState(language);
  const connection = useRef<RTCPeerConnection | null>(null), stream = useRef<MediaStream | null>(null), audio = useRef<HTMLAudioElement | null>(null);
  const active = useRef(false), turns = useRef<string[]>([]), timer = useRef<ReturnType<typeof setTimeout> | null>(null), generation = useRef(0);
  function stop(save = true) {
    generation.current++;
    active.current = false;
    connection.current?.close(); connection.current = null;
    stream.current?.getTracks().forEach(t => t.stop()); stream.current = null;
    if (audio.current) { audio.current.pause(); audio.current.srcObject = null; }
    if (timer.current) clearTimeout(timer.current);
    setPhase("idle");
    if (save && turns.current.length) onComplete(turns.current.join("\n"));
    turns.current = [];
  }
  useEffect(() => () => stop(false), []);
  useEffect(() => { if (!consent) stop(); }, [consent]);
  async function start() {
    if (active.current) { stop(); return; }
    active.current = true; const run = ++generation.current;
    setHasStarted(true);
    setPhase("permission"); setError(""); setReply(""); setPlaybackBlocked(false);
    timer.current = setTimeout(() => { setError("Connection timed out. Check microphone permission and tap to retry."); stop(); }, 45000);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (run !== generation.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      // Let the opening greeting finish before ambient speech can interrupt it.
      media.getAudioTracks().forEach(t => { t.enabled = false; });
      let greeting = true;
      const pc = new RTCPeerConnection(); connection.current = pc;
      media.getTracks().forEach(t => pc.addTrack(t, media));
      pc.ontrack = e => { if (audio.current) { audio.current.srcObject = e.streams[0]; void audio.current.play().catch(() => setPlaybackBlocked(true)); } };
      pc.onconnectionstatechange = () => { if (pc.connectionState === "failed" && active.current && run === generation.current) { setError("Voice disconnected. Tap Folio to reconnect."); stop(); } };
      const channel = pc.createDataChannel("oai-events");
      channel.onclose = () => { if (active.current && run === generation.current) { setError("Voice connection ended. Tap Folio to reconnect."); stop(); } };
      channel.onopen = () => {
        if (!active.current || run !== generation.current) return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { setError("Voice session ended after four minutes. Tap to continue."); stop(); }, 235000);
        setPhase("greeting");
        channel.send(JSON.stringify({ type: "response.create", response: { tool_choice: "none", instructions: "Speak first now in the configured language. Briefly introduce yourself: Hi, I’m Folio, your AI business report assistant. I can help prepare your Business Project Report or CMA Report. Then ask one simple question about the business, using existing context to avoid repeating known details. Keep the welcome under twenty seconds. Do not call tools in this greeting." } }));
      };
      const handledCalls = new Set<string>();
      channel.onmessage = async e => {
        if (!active.current || run !== generation.current) return;
        let event; try { event = JSON.parse(e.data); } catch { return; }
        if (event.type === "input_audio_buffer.speech_started") setPhase("listening");
        if (event.type === "input_audio_buffer.speech_stopped") setPhase("thinking");
        if (event.type === "output_audio_buffer.started") setPhase("speaking");
        if (["output_audio_buffer.stopped", "output_audio_buffer.cleared"].includes(event.type)) {
          greeting = false;
          media.getAudioTracks().forEach(t => { t.enabled = true; });
          setPhase("listening");
        }
        if (event.type === "response.done" && greeting && event.response?.status === "failed") {
          setError("Folio could not start its greeting. Tap to reconnect."); stop(); return;
        }
        if (event.type === "conversation.item.input_audio_transcription.completed" && event.transcript) turns.current.push(event.transcript);
        if (event.type === "response.output_audio_transcript.done") setReply(event.transcript || "");
        if (event.type === "response.done") for (const call of event.response?.output || []) {
          if (call.type !== "function_call" || handledCalls.has(call.call_id)) continue;
          handledCalls.add(call.call_id);
          setPhase("thinking");
          let output;
          try {
            if (call.name !== "folio_action") throw Error("Unsupported action");
            output = await actionRef.current(JSON.parse(call.arguments));
          } catch { output = { error: "Could not apply that action. Ask for missing details or ask the user to review the dashboard." }; }
          if (channel.readyState === "open") {
            channel.send(JSON.stringify({ type: "conversation.item.create", item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify(output) } }));
            if (call === event.response.output.filter((item: { type: string }) => item.type === "function_call").at(-1)) channel.send(JSON.stringify({ type: "response.create" }));
          }
        }
        if (event.type === "error") { setError("OpenAI voice encountered an error. Tap to try again."); stop(); }
      };
      setPhase("connecting");
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const result = await fetch("/api/voice/realtime", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, consent, language: selectedLanguage, sdp: offer.sdp }) });
      const body = await readJSON(result);
      if (!result.ok) throw Error(body.error || "Unable to connect");
      if (run !== generation.current) return;
      await pc.setRemoteDescription({ type: "answer", sdp: body.sdp });
    } catch (e) {
      if (run !== generation.current) return;
      setError(e instanceof Error && e.name === "NotAllowedError" ? "Allow microphone access in your browser, then tap Folio again." : e instanceof Error ? e.message : "Voice could not start.");
      stop();
    }
  }
  return <div className="voice-zone folio-simple" data-voice-phase={phase}>
    <button className="folio-tap" aria-label={phase === "idle" ? "Start OpenAI voice" : "End OpenAI voice"} aria-pressed={phase !== "idle"} disabled={!consent} onClick={() => void start()}>
      <FolioCharacter listening={phase === "listening"} speaking={phase === "speaking"} thinking={["permission", "connecting", "greeting", "thinking"].includes(phase)} paused={phase === "idle" && hasStarted} />
      <span className="folio-tap-label">{phase === "idle" ? "Tap to talk" : "Tap to end"}</span>
    </button>
    <div className="folio-feedback" role="status" aria-live="polite"><span className="folio-phase-dot" aria-hidden="true" /><strong>{{ idle: error ? "Voice could not connect · Microphone off" : hasStarted ? "Stopped · Microphone off" : "Tap Folio · I’ll introduce myself first", permission: "Waiting for microphone permission…", connecting: "Connecting your conversation…", greeting: "Folio is getting ready to greet you…", listening: "Listening · Tell me about your business", thinking: "Got it · Preparing your answer…", speaking: "Folio is speaking" }[phase]}</strong></div>
    {reply && <p>{reply}</p>}
    {error && <p role="alert">{error}</p>}
    <select aria-label="Voice language" disabled={phase !== "idle"} value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}>{["English", "Hindi", "Marathi", "Mixed"].map(x => <option key={x}>{x}</option>)}</select>
    <audio ref={audio} autoPlay hidden />
    {playbackBlocked && <button className="secondary" onClick={() => { void audio.current?.play().then(() => setPlaybackBlocked(false)).catch(() => setError("Audio playback is blocked by your browser. Check site audio permissions.")); }}>Enable Folio’s voice</button>}
  </div>;
}
