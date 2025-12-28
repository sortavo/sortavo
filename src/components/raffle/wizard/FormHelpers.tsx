import { cn } from '@/lib/utils';

interface RequiredLabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export function RequiredLabel({ children, required = true, className }: RequiredLabelProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {children}
      {required && <span className="text-destructive">*</span>}
    </span>
  );
}

interface FieldErrorProps {
  error?: string | null;
  touched?: boolean;
  className?: string;
}

export function FieldError({ error, touched, className }: FieldErrorProps) {
  if (!error || !touched) return null;
  
  return (
    <p className={cn("text-sm font-medium text-destructive mt-1", className)}>
      {error}
    </p>
  );
}
