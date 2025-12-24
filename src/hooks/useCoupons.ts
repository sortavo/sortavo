import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { successToast, errorToast } from '@/lib/toast-helpers';

export interface Coupon {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  raffle_id: string | null;
  min_purchase: number | null;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  ticket_id: string;
  discount_applied: number;
  used_at: string;
  user_email: string | null;
}

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses?: number;
  valid_until?: string;
  raffle_id?: string;
  min_purchase?: number;
}

export function useCoupons() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const couponsQuery = useQuery({
    queryKey: ['coupons', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Coupon[];
    },
    enabled: !!organization?.id
  });

  const createCoupon = useMutation({
    mutationFn: async (data: CreateCouponData) => {
      if (!organization?.id) throw new Error('No organization');
      
      const { error } = await supabase
        .from('coupons' as any)
        .insert({
          organization_id: organization.id,
          ...data,
          code: data.code.toUpperCase(),
        } as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      successToast('Cupón creado exitosamente');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        errorToast('Este código ya existe');
      } else {
        errorToast('Error al crear cupón');
      }
    }
  });

  const toggleCoupon = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('coupons' as any)
        .update({ active, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      successToast('Estado del cupón actualizado');
    }
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons' as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      successToast('Cupón eliminado');
    },
    onError: () => {
      errorToast('Error al eliminar cupón');
    }
  });

  const validateCoupon = async (
    code: string, 
    raffleId: string, 
    totalAmount: number
  ): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error || !data) {
        return { valid: false, error: 'Cupón no válido' };
      }

      const coupon = data as unknown as Coupon;

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return { valid: false, error: 'Cupón expirado' };
      }

      if (new Date(coupon.valid_from) > new Date()) {
        return { valid: false, error: 'Cupón aún no válido' };
      }

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, error: 'Cupón agotado' };
      }

      if (coupon.min_purchase && totalAmount < coupon.min_purchase) {
        return { valid: false, error: `Compra mínima: $${coupon.min_purchase}` };
      }

      if (coupon.raffle_id && coupon.raffle_id !== raffleId) {
        return { valid: false, error: 'Cupón no válido para este sorteo' };
      }

      return { valid: true, coupon };
    } catch (error) {
      return { valid: false, error: 'Error al validar cupón' };
    }
  };

  const calculateDiscount = (coupon: Coupon, subtotal: number): number => {
    if (coupon.discount_type === 'percentage') {
      return subtotal * (coupon.discount_value / 100);
    }
    return Math.min(coupon.discount_value, subtotal);
  };

  return {
    coupons: couponsQuery.data || [],
    isLoading: couponsQuery.isLoading,
    error: couponsQuery.error,
    createCoupon,
    toggleCoupon,
    deleteCoupon,
    validateCoupon,
    calculateDiscount
  };
}
