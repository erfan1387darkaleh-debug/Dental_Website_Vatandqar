"use client";

import { useSyncExternalStore } from "react";
import { todayTehranDate } from "./time";
import type { TehranDate } from "./time";

/** اشتراک‌دهندهٔ نوسازی؛ مقدار «امروز» در طول عمر مؤلفه ثابت می‌ماند */
const subscribe = (): (() => void) => () => {};

function getSnapshot(): TehranDate {
  return todayTehranDate(Date.now());
}

function getServerSnapshot(): TehranDate | null {
  return null;
}

/**
 * «امروز» تقویمی تهران فقط سمت مرورگر — در پیش‌رندر سرور null است و پس
 * از هیدراسیون مقدار واقعی می‌گیرد. بدون setState در effect (سازگار با
 * قواعد react-hooks) و مصون از ناهماهنگی Intl سرور/مرورگر.
 */
export function useClientToday(): TehranDate | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
