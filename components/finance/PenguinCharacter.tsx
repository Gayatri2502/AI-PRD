"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Object3D, Material } from "three";

export default function PenguinCharacter({ speaking, listening, thinking, paused = false, analyser }: {
  speaking: boolean; listening: boolean; thinking: boolean; paused?: boolean; analyser?: RefObject<AnalyserNode | null>;
}) {
  const host = useRef<HTMLDivElement>(null), state = useRef({ speaking, listening, thinking, paused, analyser });
  state.current = { speaking, listening, thinking, paused, analyser };
  const [ready, setReady] = useState(false);
  const phase = speaking ? "speaking" : listening ? "listening" : thinking ? "thinking" : paused ? "paused" : "ready";
  useEffect(() => {
    let disposed = false, cleanup = () => {};
    void import("three").then(T => {
      if (disposed || !host.current) return;
      const element = host.current;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); } catch { return; }
      renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
      renderer.domElement.setAttribute("aria-hidden", "true"); element.appendChild(renderer.domElement);
      const scene = new T.Scene(), camera = new T.PerspectiveCamera(33, 1, .1, 30);
      camera.position.set(0, .32, 6.3); camera.lookAt(0, .2, 0);
      scene.add(new T.HemisphereLight(0xdceeff, 0xa39481, 2.4));
      for (const [color, intensity, x, y, z] of [[0xfff0d8, 4, -3, 4, 5], [0xa7caff, 3, 3, 2, -3], [0xffffff, 1, 2, 0, 4]]) { const light = new T.DirectionalLight(color, intensity); light.position.set(x, y, z); scene.add(light); }
      const materials: Material[] = [];
      const mat = (color: string, roughness = .55) => { const m = new T.MeshPhysicalMaterial({ color, roughness, clearcoat: .25, clearcoatRoughness: .35 }); materials.push(m); return m; };
      const navy = mat("#273b58"), cream = mat("#fff5dc"), orange = mat("#ffac25", .3), black = mat("#101725", .12), white = mat("#ffffff", .17), blush = mat("#f1b1a7");
      const sphere = new T.SphereGeometry(1, 40, 28), penguin = new T.Group(); scene.add(penguin);
      const oval = (parent: Object3D, material: Material, p: number[], s: number[]) => { const mesh = new T.Mesh(sphere, material); mesh.position.set(p[0], p[1], p[2]); mesh.scale.set(s[0], s[1], s[2]); parent.add(mesh); return mesh; };
      oval(penguin, navy, [0, -.35, 0], [.69, .92, .54]); oval(penguin, cream, [0, -.4, .255], [.575, .79, .34]);
      for (const side of [-1, 1]) oval(penguin, orange, [side * .29, -1.18, .22], [.255, .115, .34]);
      const wings = [-1, 1].map(side => { const wing = new T.Group(); wing.position.set(side * .57, .02, -.03); penguin.add(wing); oval(wing, navy, [side * .16, -.38, .02], [.18, .56, .16]); wing.rotation.z = side * .28; return wing; });
      const head = new T.Group(); head.position.y = .67; penguin.add(head); oval(head, navy, [0, 0, 0], [.68, .68, .55]);
      for (const side of [-1, 1]) oval(head, cream, [side * .265, -.02, .365], [.31, .49, .235]);
      oval(head, cream, [0, -.3, .35], [.38, .28, .22]);
      const eyes = [-1, 1].map(side => {
        const eye = new T.Group(); eye.position.set(side * .275, .055, .562); head.add(eye);
        oval(eye, white, [0, 0, 0], [.17, .205, .085]); const pupil = new T.Group(); eye.add(pupil);
        oval(pupil, black, [side * -.012, -.005, .068], [.103, .139, .064]); oval(pupil, white, [-.03, .044, .127], [.029, .034, .013]); oval(pupil, white, [.035, -.045, .123], [.012, .014, .009]);
        oval(head, blush, [side * .443, -.225, .516], [.085, .044, .022]); return { eye, pupil };
      });
      oval(head, black, [0, -.21, .597], [.183, .06, .14]); oval(head, orange, [0, -.155, .638], [.195, .095, .2]);
      const jaw = new T.Group(); jaw.position.set(0, -.2, .53); head.add(jaw); oval(jaw, orange, [0, -.015, .12], [.169, .06, .168]);
      const tuftGeo = new T.ConeGeometry(.085, .35, 20);
      for (let i = -1; i <= 1; i++) { const tuft = new T.Mesh(tuftGeo, navy); tuft.position.set(i * .1, .69, -.025); tuft.rotation.z = i * -.4; tuft.rotation.x = -.25; head.add(tuft); }
      const shadow = new T.MeshBasicMaterial({ color: 0x253b50, transparent: true, opacity: .1 }); materials.push(shadow); oval(scene, shadow, [0, -1.29, 0], [.7, .012, .4]);
      const pointer = { x: 0, y: 0, over: false }, target = element.closest("button") || element;
      const move = (e: PointerEvent) => { if (e.pointerType === "touch") return; const b = target.getBoundingClientRect(); pointer.x = Math.max(-1, Math.min(1, (e.clientX - b.left) / b.width * 2 - 1)); pointer.y = Math.max(-1, Math.min(1, (e.clientY - b.top) / b.height * 2 - 1)); pointer.over = true; };
      const leave = () => { pointer.x = 0; pointer.y = 0; pointer.over = false; }, focus = () => { pointer.over = true; };
      target.addEventListener("pointermove", move as EventListener); target.addEventListener("pointerleave", leave); target.addEventListener("focus", focus); target.addEventListener("blur", leave);
      const resize = () => { const w = element.clientWidth || 260, h = element.clientHeight || 290; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
      const observer = new ResizeObserver(resize); observer.observe(element); resize();
      let visible = true; const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }); intersection.observe(element);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)"), samples = new Uint8Array(256); let last = 0, mouth = 0;
      renderer.setAnimationLoop(ms => {
        if (disposed || !visible || document.hidden || ms - last < 32) return;
        last = ms; const t = ms / 1000, s = state.current, motion = !reduced.matches && !s.paused; let energy = 0;
        if (s.speaking) { const meter = s.analyser?.current; if (meter) { meter.getByteTimeDomainData(samples); let total = 0; for (const value of samples) total += ((value - 128) / 128) ** 2; energy = Math.min(1, Math.sqrt(total / samples.length) * 7); } else energy = .32 + Math.sin(t * 17) * .18; }
        mouth += (energy - mouth) * .38; jaw.rotation.x = motion ? mouth * .65 : s.speaking ? .16 : 0; jaw.position.y = -.2 - (motion ? mouth * .05 : 0);
        head.rotation.y += ((motion ? pointer.x * .22 : 0) - head.rotation.y) * .1;
        head.rotation.x += ((motion ? pointer.y * .12 + (s.speaking ? Math.sin(t * 3.8) * .025 : s.listening ? -.055 : 0) : 0) - head.rotation.x) * .1;
        head.rotation.z += ((s.listening ? -.085 : s.thinking ? .09 : 0) - head.rotation.z) * .07;
        penguin.rotation.y += ((motion ? pointer.x * .1 : 0) - penguin.rotation.y) * .08; penguin.position.y = motion ? Math.sin(t * 1.6) * .014 : 0;
        const blink = motion && t % 4.7 < .15 ? .12 : 1;
        eyes.forEach(({ eye, pupil }) => { eye.scale.y += (blink - eye.scale.y) * .65; pupil.position.x = motion ? pointer.x * .025 : 0; pupil.position.y = motion ? -pointer.y * .025 + (s.thinking ? .025 : 0) : 0; });
        wings[0].rotation.z = -.28 - (motion && s.speaking ? Math.sin(t * 3) * .06 : 0);
        wings[1].rotation.z += ((motion && pointer.over && !s.speaking ? -.75 + Math.sin(t * 5) * .13 : .28 + (motion && s.speaking ? Math.sin(t * 3 + 1) * .09 : 0)) - wings[1].rotation.z) * .1;
        renderer.render(scene, camera);
      });
      renderer.render(scene, camera); setReady(true);
      const lost = (e: Event) => { e.preventDefault(); setReady(false); renderer.setAnimationLoop(null); }; renderer.domElement.addEventListener("webglcontextlost", lost);
      cleanup = () => { renderer.setAnimationLoop(null); observer.disconnect(); intersection.disconnect(); target.removeEventListener("pointermove", move as EventListener); target.removeEventListener("pointerleave", leave); target.removeEventListener("focus", focus); target.removeEventListener("blur", leave); renderer.domElement.removeEventListener("webglcontextlost", lost); sphere.dispose(); tuftGeo.dispose(); materials.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove(); };
    }).catch(() => { if (!disposed) setReady(false); });
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div className={`folio-penguin ${phase}`} role="img" aria-label={`Folio penguin, ${phase}`}><div ref={host} className="folio-penguin-stage" data-renderer={ready ? "webgl" : "image"}>{!ready && <img src="/folio-penguin.png" alt="" width="320" height="320" />}</div><span className="folio-status"><i />{speaking ? "Folio is speaking" : listening ? "Folio is listening" : thinking ? "Folio is thinking" : paused ? "Microphone off" : "Ready when you are"}</span></div>;
}
