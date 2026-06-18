"use client";
/* Chat de un pedido (cliente <-> Holoverse). Permite adjuntar archivos:
   comprobantes de pago, guías de envío, fotos para coordinar la entrega.
   Reutilizado por la página de seguimiento del cliente y por el panel admin.
   Estilado con variables globales para verse bien en ambos temas. */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import { Icon } from "./ui";

const fileName = (p: string) => { const ext = (p.split(".").pop() || "").toLowerCase(); return ext ? `archivo.${ext}` : "archivo"; };
const isImage = (p: string) => /\.(png|jpe?g|webp|gif|avif|heic)$/i.test(p);
const fmtTime = (iso: string) => new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function OrderChat({ orderId, ownerId, selfId, customerName = "Cliente" }: any) {
  const sb = supabaseBrowser();
  const [messages, setMessages] = useState<any[]>([]);
  const [urls, setUrls] = useState<any>({});
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const signedRef = useRef<Set<string>>(new Set());
  const fileRef = useRef<any>(null);
  const endRef = useRef<any>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("order_messages").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
    const msgs = data || [];
    setMessages(msgs);
    setLoaded(true);
    const missing = msgs.flatMap((m: any) => m.attachments || []).filter((p: string) => !signedRef.current.has(p));
    if (missing.length) {
      const { data: signed } = await sb.storage.from("order-attachments").createSignedUrls(missing, 3600);
      if (signed) {
        const add: any = {};
        signed.forEach((s: any) => { if (s.signedUrl) { add[s.path] = s.signedUrl; signedRef.current.add(s.path); } });
        setUrls((prev: any) => ({ ...prev, ...add }));
      }
    }
  }, [orderId, sb]);

  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length]);

  const addFiles = (list: any) => setFiles((prev) => [...prev, ...Array.from(list || [])] as File[]);

  const send = async () => {
    if (!selfId || (!text.trim() && files.length === 0) || sending) return;
    setSending(true);
    const paths: string[] = [];
    for (const f of files) {
      const ext = (f.name.split(".").pop() || "bin").toLowerCase();
      const path = `${orderId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
      const { error } = await sb.storage.from("order-attachments").upload(path, f, { cacheControl: "3600" });
      if (!error) paths.push(path);
    }
    const { error } = await sb.from("order_messages").insert({
      order_id: orderId, sender_id: selfId, body: text.trim() || null, attachments: paths.length ? paths : null,
    });
    setSending(false);
    if (!error) { setText(""); setFiles([]); load(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--good, #9fe8b0)" }} />
        <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 14 }}>Chat del pedido</span>
        <span className="muted" style={{ fontSize: 12 }}>· comprobantes, guías, coordinación</span>
      </div>

      {/* mensajes */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, maxHeight: 380, overflowY: "auto", minHeight: 160 }}>
        {!loaded ? <p className="muted" style={{ fontSize: 13 }}>Cargando…</p>
          : messages.length === 0 ? <p className="muted" style={{ fontSize: 13, margin: "auto", textAlign: "center" }}>Todavía no hay mensajes. Escribinos para coordinar el pago o la entrega.</p>
          : messages.map((m) => {
            const mine = m.sender_id === selfId;
            const who = m.sender_id === ownerId ? customerName : "Holoverse";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 4 }}>
                <span className="muted" style={{ fontSize: 11 }}>{who} · {fmtTime(m.created_at)}</span>
                <div style={{ maxWidth: "80%", padding: m.body ? "9px 13px" : 6, borderRadius: 14, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  background: mine ? "var(--accent-soft, rgba(139,125,255,.14))" : "var(--surface-2)",
                  border: `1px solid ${mine ? "var(--border-glow, var(--border))" : "var(--border)"}` }}>
                  {m.body}
                  {(m.attachments || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: m.body ? 8 : 0 }}>
                      {m.attachments.map((p: string) => (
                        isImage(p)
                          ? <a key={p} href={urls[p] || "#"} target="_blank" rel="noreferrer" style={{ display: "block", width: 92, height: 92, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                              {urls[p] ? <img src={urls[p]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                            </a>
                          : <a key={p} href={urls[p] || "#"} target="_blank" rel="noreferrer" className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", textDecoration: "none" }}>
                              <Icon name="box" size={13} />{fileName(p)}
                            </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: 12 }}>
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {files.map((f, i) => (
              <span key={i} className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
                {f.name.slice(0, 22)}
                <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", padding: 0, display: "grid", placeItems: "center" }}><Icon name="close" size={11} /></button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={(e: any) => { addFiles(e.target.files); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} title="Adjuntar archivo" className="btn btn-icon" style={{ flexShrink: 0 }}><Icon name="plus" size={16} /></button>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escribí un mensaje…" className="input" style={{ flex: 1, resize: "none", minHeight: 40, padding: "9px 12px" }} />
          <button onClick={send} disabled={sending || (!text.trim() && files.length === 0)} className="btn btn-holo" style={{ flexShrink: 0 }}>
            {sending ? "…" : <Icon name="arrow" size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
