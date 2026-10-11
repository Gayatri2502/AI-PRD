"use client";
import { useEffect, useRef, useState } from "react";
import FolioCharacter from "./FolioCharacter";
import { readJSON } from "@/lib/http";

export default function RealtimeVoice({ businessId, consent, language, onComplete, onAction }: {
  businessId: string; consent: boolean; language: string; onComplete: (transcript: string) => void; onAction: (action: unknown) => Promise<unknown>;
}) {
  const actionRef = useRef(onAction); actionRef.current = onAction;
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
    setPhase("permission"); setError(""); setReply("");
    timer.current = setTimeout(() => { setError("Connection timed out. Check microphone permission and tap to retry."); stop(); }, 45000);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (run !== generation.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      const pc = new RTCPeerConnection(); connection.current = pc;
      media.getTracks().forEach(t => pc.addTrack(t, media));
      pc.ontrack = e => { if (audio.current) { audio.current.srcObject = e.streams[0]; void audio.current.play().catch(() => setError("Tap Play on the audio control to hear Folio.")); } };
      pc.onconnectionstatechange = () => { if (pc.connectionState === "failed" && active.current) { setError("Voice disconnected. Tap Folio to reconnect."); stop(); } };
      const channel = pc.createDataChannel("oai-events");
      channel.onopen = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { setError("Voice session ended after four minutes. Tap to continue."); stop(); }, 235000);
        setPhase("listening");
        channel.send(JSON.stringify({ type: "response.create", response: { instructions: "Greet the user briefly as Folio and ask one missing business question. Use the configured language." } }));
      };
      const handledCalls = new Set<string>();
      channel.onmessage = async e => {
        if (!active.current) return;
        let event; try { event = JSON.parse(e.data); } catch { return; }
        if (event.type === "input_audio_buffer.speech_started") setPhase("listening");
        if (event.type === "input_audio_buffer.speech_stopped") setPhase("thinking");
        if (event.type === "output_audio_buffer.started") setPhase("speaking");
        if (["output_audio_buffer.stopped", "output_audio_buffer.cleared"].includes(event.type)) setPhase("listening");
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
  return <div className="voice-zone folio-simple">
    <button className="folio-tap" aria-label={phase === "idle" ? "Start OpenAI voice" : "End OpenAI voice"} aria-pressed={phase !== "idle"} disabled={!consent} onClick={() => void start()}>
      <FolioCharacter listening={phase === "listening"} speaking={phase === "speaking"} thinking={["connecting", "thinking"].includes(phase)} />
      <span className="folio-tap-label">{phase === "idle" ? "Tap to talk" : "Tap to end"}</span>
    </button>
    <div className="folio-feedback" role="status" aria-live="polite"><strong>{{ idle: "Talk naturally with Folio", permission: "Allow microphone access", connecting: "Connecting to OpenAI…", listening: "I’m listening", thinking: "Thinking…", speaking: "Folio is speaking — you can interrupt" }[phase]}</strong></div>
    {reply && <p>{reply}</p>}
    {error && <p role="alert">{error}</p>}
    <select aria-label="Voice language" disabled={phase !== "idle"} value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}>{["English", "Hindi", "Marathi", "Mixed"].map(x => <option key={x}>{x}</option>)}</select>
    <audio ref={audio} autoPlay controls aria-label="Folio voice playback" style={{ width: "100%", height: 32 }} />
    <small>Ask Folio to update your details, change report style, or review your report. Voice tokens sync with your daily usage. Calls last up to four minutes.</small>
  </div>;
}
