-- Table to audit admin user simulations
CREATE TABLE public.admin_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  simulated_user_id uuid NOT NULL,
  simulated_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'readonly' CHECK (mode IN ('readonly', 'full_access')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  actions_taken jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_simulations ENABLE ROW LEVEL SECURITY;

-- Only platform admins can insert their own simulations
CREATE POLICY "Platform admins can insert their simulations"
ON public.admin_simulations
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

-- Platform admins can view all simulations (for audit)
CREATE POLICY "Platform admins can view all simulations"
ON public.admin_simulations
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Platform admins can update their own active simulations
CREATE POLICY "Platform admins can update their simulations"
ON public.admin_simulations
FOR UPDATE
USING (is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

-- Add index for performance
CREATE INDEX idx_admin_simulations_admin_user ON public.admin_simulations(admin_user_id);
CREATE INDEX idx_admin_simulations_active ON public.admin_simulations(admin_user_id) WHERE ended_at IS NULL;