import 'server-only';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function getUserCreditsInfo({ userId }: { userId: string }) {
  try {
    const supabase = await createClient();
    const { data: userInfo, error } = await supabase
      .from('users')
      .select('credits, reserved_credits')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    console.log('userInfo', userInfo);

    return {
      totalCredits: userInfo.credits,
      availableCredits: userInfo.credits - userInfo.reserved_credits,
      reservedCredits: userInfo.reserved_credits,
    };
  } catch (error) {
    console.error('Failed to get user credits info:', error);
    return null;
  }
}

export async function reserveAvailableCredits({
  userId,
  maxAmount,
  minAmount,
}: {
  userId: string;
  maxAmount: number;
  minAmount: number;
}): Promise<
  | {
      success: true;
      reservedAmount: number;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    const supabase = await createClient();

    const userInfo = await getUserCreditsInfo({ userId });
    if (!userInfo) {
      return { success: false, error: 'User not found' };
    }

    const availableCredits = userInfo.availableCredits;
    const amountToReserve = Math.min(maxAmount, availableCredits);

    if (amountToReserve < minAmount) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Use RPC to atomically update reserved credits
    const { data, error } = await supabase.rpc('reserve_credits', {
      user_id: userId,
      amount_to_reserve: amountToReserve,
      required_available: amountToReserve,
    });
    
    if (error || !data) {
      // Fallback: function missing (local dev) — try naive row update with RLS
      if ((error as any)?.code === 'PGRST202') {
        const updated = await supabase
          .from('users')
          .update({ reserved_credits: userInfo.reservedCredits + amountToReserve })
          .eq('id', userId)
          .select('reserved_credits')
          .single();
        if ((updated as any).error) {
          console.error('Fallback reserve failed:', (updated as any).error);
          return { success: false, error: 'Failed to reserve credits' };
        }
      } else {
        console.error('Failed to reserve credits:', error);
        return { success: false, error: 'Failed to reserve credits' };
      }
    }

    return {
      success: true,
      reservedAmount: amountToReserve,
    };
  } catch (error) {
    console.error('Failed to reserve available credits:', error);
    return { success: false, error: 'Failed to reserve credits' };
  }
}

export async function finalizeCreditsUsage({
  userId,
  reservedAmount,
  actualAmount,
}: {
  userId: string;
  reservedAmount: number;
  actualAmount: number;
}): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('finalize_credit_usage', {
      user_id: userId,
      reserved_amount: reservedAmount,
      actual_amount: actualAmount,
    });

    if (error) {
      if ((error as any).code === 'PGRST202') {
        // Fallback: do a single-row update under RLS
        const info = await getUserCreditsInfo({ userId });
        if (!info) throw error;
        const newReserved = Math.max(info.reservedCredits - reservedAmount, 0);
        const newCredits = Math.max(info.totalCredits - actualAmount, 0);
        const { error: updError } = await supabase
          .from('users')
          .update({
            reserved_credits: newReserved,
            credits: newCredits,
          })
          .eq('id', userId);
        if (updError) throw updError;
      } else {
        console.error('Failed to finalize credits usage:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to finalize credits usage:', error);
    throw error;
  }
}

export async function releaseReservedCredits({
  userId,
  amount,
}: {
  userId: string;
  amount: number;
}): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('release_reserved_credits', {
      user_id: userId,
      reserved_amount: amount,
    });

    if (error) {
      if ((error as any).code === 'PGRST202') {
        // Fallback: decrement reserved_credits with RLS
        const info = await getUserCreditsInfo({ userId });
        if (!info) throw error;
        const newReserved = Math.max(info.reservedCredits - amount, 0);
        const { error: updError } = await supabase
          .from('users')
          .update({ reserved_credits: newReserved })
          .eq('id', userId);
        if (updError) throw updError;
      } else {
        console.error('Failed to release reserved credits:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to release reserved credits:', error);
    throw error;
  }
}
