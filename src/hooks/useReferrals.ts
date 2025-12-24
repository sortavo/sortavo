import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { successToast, errorToast } from '@/lib/toast-helpers';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_type: string | null;
  reward_value: number | null;
  created_at: string;
  completed_at: string | null;
}

export function useReferrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const referralsQuery = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('referrals' as any)
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Referral[];
    },
    enabled: !!user?.id
  });

  const createReferral = useMutation({
    mutationFn: async (email: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: existing } = await supabase
        .from('referrals' as any)
        .select('id')
        .eq('referrer_id', user.id)
        .eq('referred_email', email.toLowerCase())
        .maybeSingle();
      
      if (existing) {
        throw new Error('Ya has invitado a este email');
      }
      
      const { error } = await supabase
        .from('referrals' as any)
        .insert({
          referrer_id: user.id,
          referred_email: email.toLowerCase(),
          reward_type: 'discount',
          reward_value: 20
        } as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      successToast('Invitación registrada');
    },
    onError: (error: any) => {
      errorToast(error.message || 'Error al crear invitación');
    }
  });

  const sendReferralInvite = useMutation({
    mutationFn: async ({ email, referrerName }: { email: string; referrerName: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const referralLink = `${window.location.origin}/signup?ref=${user.id}`;
      
      await createReferral.mutateAsync(email);
      
      await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          template: 'referral_invite',
          data: {
            referrer_name: referrerName,
            referral_link: referralLink
          }
        }
      });
    },
    onSuccess: () => {
      successToast('Invitación enviada por email');
    },
    onError: (error: any) => {
      errorToast(error.message || 'Error al enviar invitación');
    }
  });

  const getReferralLink = () => {
    if (!user?.id) return '';
    return `${window.location.origin}/signup?ref=${user.id}`;
  };

  const stats = {
    total: referralsQuery.data?.length || 0,
    pending: referralsQuery.data?.filter(r => r.status === 'pending').length || 0,
    completed: referralsQuery.data?.filter(r => r.status === 'completed').length || 0,
    rewarded: referralsQuery.data?.filter(r => r.status === 'rewarded').length || 0
  };

  return {
    referrals: referralsQuery.data || [],
    isLoading: referralsQuery.isLoading,
    error: referralsQuery.error,
    createReferral,
    sendReferralInvite,
    getReferralLink,
    stats
  };
}
