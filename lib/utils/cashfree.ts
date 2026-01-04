// lib/utils/cashfree.ts
// Shared validation utilities for Cashfree

export function validateCashfreeEnv() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  const baseUrl = process.env.CASHFREE_BASE_URL?.trim();

  if (!appId || !secret || !baseUrl) {
    throw new Error("Cashfree environment variables not configured");
  }

  return { appId, secret, baseUrl };
}

export function validateCashfreeWebhookSecret() {
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new Error("CASHFREE_WEBHOOK_SECRET not configured");
  }
  return webhookSecret;
}

export function validateAmount(value: any): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount: must be a positive number");
  }
  return amount;
}

