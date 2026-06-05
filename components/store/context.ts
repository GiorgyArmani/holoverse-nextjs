"use client";
/* Contexto global de la tienda (router interno, carrito, auth, wishlist).
   El provider vive en components/Holoverse.tsx. */
import { createContext, useContext } from "react";

export const HVCtx = createContext<any>(null);
export const useHV = (): any => useContext(HVCtx);
