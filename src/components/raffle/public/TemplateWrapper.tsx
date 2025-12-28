import { ReactNode, useMemo } from 'react';
import { getTemplateById, RaffleTemplate } from '@/lib/raffle-utils';

interface TemplateWrapperProps {
  templateId: string | null | undefined;
  children: ReactNode;
  className?: string;
}

export function TemplateWrapper({ templateId, children, className = '' }: TemplateWrapperProps) {
  const template = useMemo(() => getTemplateById(templateId), [templateId]);

  const cssVariables = useMemo(() => ({
    '--template-primary': template.colors.primary,
    '--template-secondary': template.colors.secondary,
    '--template-accent': template.colors.accent,
    '--template-background': template.colors.background,
    '--template-card-bg': template.colors.cardBg,
    '--template-text': template.colors.text,
    '--template-text-muted': template.colors.textMuted,
    '--template-font-title': template.fonts.title,
    '--template-font-body': template.fonts.body,
    '--template-border-radius': template.effects.borderRadius,
    '--template-shadow': template.effects.shadow,
    '--template-gradient': template.effects.gradient,
  } as React.CSSProperties), [template]);

  return (
    <div 
      style={cssVariables}
      className={className}
      data-template={template.id}
    >
      {children}
    </div>
  );
}

// Hook to get template styles for use in components
export function useTemplateStyles(templateId: string | null | undefined) {
  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  
  return {
    template,
    styles: {
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,
      accentColor: template.colors.accent,
      backgroundColor: template.colors.background,
      cardBg: template.colors.cardBg,
      textColor: template.colors.text,
      textMuted: template.colors.textMuted,
      fontTitle: template.fonts.title,
      fontBody: template.fonts.body,
      borderRadius: template.effects.borderRadius,
      shadow: template.effects.shadow,
      gradient: template.effects.gradient,
      pattern: template.effects.pattern,
    },
    // Pre-built style objects for common use cases
    titleStyle: {
      fontFamily: `"${template.fonts.title}", sans-serif`,
      color: template.colors.text,
    },
    bodyStyle: {
      fontFamily: `"${template.fonts.body}", sans-serif`,
      color: template.colors.text,
    },
    cardStyle: {
      backgroundColor: template.colors.cardBg,
      borderRadius: template.effects.borderRadius,
      boxShadow: template.effects.shadow,
    },
    buttonPrimaryStyle: {
      background: template.effects.gradient,
      borderRadius: template.effects.borderRadius,
      color: '#FFFFFF',
      fontFamily: `"${template.fonts.body}", sans-serif`,
    },
    buttonSecondaryStyle: {
      backgroundColor: template.colors.cardBg,
      borderColor: template.colors.primary,
      color: template.colors.primary,
      borderRadius: template.effects.borderRadius,
      fontFamily: `"${template.fonts.body}", sans-serif`,
    },
    badgeStyle: {
      background: template.effects.gradient,
      color: '#FFFFFF',
      borderRadius: '9999px',
    },
  };
}

export type { RaffleTemplate };
