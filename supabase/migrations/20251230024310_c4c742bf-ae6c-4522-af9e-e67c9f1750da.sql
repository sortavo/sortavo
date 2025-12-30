-- Add 'enterprise' value to subscription_tier ENUM
ALTER TYPE public.subscription_tier ADD VALUE IF NOT EXISTS 'enterprise';