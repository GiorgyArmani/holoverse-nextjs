"use client";
/* "Prisma", el familiar holográfico de la bóveda (mascota). */
import React, { useState, useEffect } from "react";
import { useHV } from "./context";
import { Icon } from "./ui";

export default function Prisma() {
  const { openSearch } = useHV();
  const tips = [
    "¡Bienvenido a la bóveda! ✦",
    "¿Buscás algo puntual? Tocame y te ayudo.",
    "Llegaron nuevos chase esta semana ✦",
    "Los cofres sellados tienen preventa abierta.",
    "Guardo tus cartas en mi bolsito ✦",
  ];
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setI((x) => (x + 1) % tips.length), 5200);
    return () => clearInterval(t);
  }, [open]);
  return (
    <div className="prisma-wrap">
      {open && (
        <div className="prisma-bubble fade-up">
          <button className="prisma-x" onClick={() => setOpen(false)} aria-label="Cerrar"><Icon name="close" size={12} /></button>
          <div className="prisma-name">Prisma</div>
          <div className="prisma-msg">{tips[i]}</div>
          <button className="prisma-cta" onClick={openSearch}><Icon name="search" size={13} solid /> Buscar cartas</button>
        </div>
      )}
      <div className="prisma-sprite" role="button" tabIndex={0} aria-label="Prisma, tu hada de luz" onClick={() => setOpen((o) => !o)}>
        <span className="pf-wing pf-w1" />
        <span className="pf-wing pf-w2" />
        <span className="pf-wing pf-w3" />
        <span className="pf-wing pf-w4" />
        <span className="pf-halo" />
        <span className="pf-core" />
        <span className="pf-spark pf-s1" />
        <span className="pf-spark pf-s2" />
        <span className="pf-spark pf-s3" />
        <span className="pf-trail pf-t1" />
        <span className="pf-trail pf-t2" />
        <span className="pf-trail pf-t3" />
        <span className="pf-trail pf-t4" />
      </div>
    </div>
  );
}
