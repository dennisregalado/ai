import { reserveCreditsWithCleanup } from '@/lib/credits/credit-reservation';
import { getUserCreditsInfo, releaseReservedCredits } from '@/lib/repositories/credits';

export async function getCreditReservation(
  userId: string,
  baseModelCost: number,
) {
  // First attempt
  let reservedCredits = await reserveCreditsWithCleanup(userId, baseModelCost, 1);

  if (!reservedCredits.success) {
    // Try to auto-recover from stale reservations by releasing any reserved credits
    const info = await getUserCreditsInfo({ userId });
    if (info && info.reservedCredits > 0) {
      try {
        await releaseReservedCredits({ userId, amount: info.reservedCredits });
        // Retry once after releasing
        reservedCredits = await reserveCreditsWithCleanup(
          userId,
          baseModelCost,
          1,
        );
      } catch (e) {
        // Ignore and fall through to error return
      }
    }
  }

  if (!reservedCredits.success) {
    return { reservation: null, error: reservedCredits.error };
  }

  return { reservation: reservedCredits.reservation, error: null };
}
