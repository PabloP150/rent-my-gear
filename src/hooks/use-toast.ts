"use client";

import * as React from "react";

interface ToastInput {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastItem extends ToastInput {
  id: string;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l(items));
}

export function toast(input: ToastInput) {
  const id = Math.random().toString(36).slice(2);
  items = [...items, { id, ...input }];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, 4000);
}

export function useToast() {
  const [state, setState] = React.useState<ToastItem[]>(items);
  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return { toasts: state, toast };
}
