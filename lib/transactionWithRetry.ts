// FIX #7: Transaction retry limit wrapper
// Prevents infinite retry loops under high concurrency

import { Firestore } from "firebase-admin/firestore";

export async function runTransactionWithRetry<T>(
  firestore: Firestore,
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await firestore.runTransaction(updateFunction);
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on non-conflict errors
      if (!error.message?.includes("ABORTED") && !error.message?.includes("conflict")) {
        throw error;
      }
      
      console.log(`[Transaction] Retry ${attempt}/${maxRetries} due to conflict`);
      
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  console.error(`[Transaction] Failed after ${maxRetries} retries`);
  throw lastError || new Error("Transaction failed after max retries");
}
