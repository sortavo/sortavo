import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ColorSwatchProps {
  name: string;
  variable: string;
  className: string;
  textClassName?: string;
  description?: string;
}

const ColorSwatch = ({ name, variable, className, textClassName = "text-foreground", description }: ColorSwatchProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(variable);
    setCopied(true);
    toast.success(`Copiado: ${variable}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="group relative cursor-pointer"
      onClick={copyToClipboard}
    >
      <div className={cn(
        "h-20 rounded-lg border border-border/50 flex items-end p-3 transition-all",
        "hover:scale-105 hover:shadow-lg",
        className
      )}>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className={cn("text-sm font-medium", textClassName)}>{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{variable}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70">{description}</p>
        )}
      </div>
    </div>
  );
};

interface ColorSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const ColorSection = ({ title, description, children }: ColorSectionProps) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {children}
    </div>
  </div>
);

export const ColorPalette = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            Sistema de Diseño
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Paleta de colores "Negro & Esmeralda" de Sortavo. Haz clic en cualquier color para copiar su clase de Tailwind.
          </p>
        </div>

        {/* Base Colors */}
        <ColorSection 
          title="Colores Base" 
          description="Fondos y texto principales de la aplicación"
        >
          <ColorSwatch
            name="Background"
            variable="bg-background"
            className="bg-background"
            description="Fondo principal"
          />
          <ColorSwatch
            name="Foreground"
            variable="text-foreground"
            className="bg-foreground"
            description="Texto principal"
          />
          <ColorSwatch
            name="Card"
            variable="bg-card"
            className="bg-card"
            description="Fondo de tarjetas"
          />
          <ColorSwatch
            name="Card Foreground"
            variable="text-card-foreground"
            className="bg-card-foreground"
            description="Texto en tarjetas"
          />
          <ColorSwatch
            name="Muted"
            variable="bg-muted"
            className="bg-muted"
            description="Fondos secundarios"
          />
          <ColorSwatch
            name="Muted Foreground"
            variable="text-muted-foreground"
            className="bg-muted-foreground"
            description="Texto secundario"
          />
        </ColorSection>

        {/* Brand Colors */}
        <ColorSection 
          title="Colores de Marca" 
          description="Esmeralda como color primario, dorado como acento"
        >
          <ColorSwatch
            name="Primary"
            variable="bg-primary"
            className="bg-primary"
            description="Color principal"
          />
          <ColorSwatch
            name="Primary Foreground"
            variable="text-primary-foreground"
            className="bg-primary-foreground"
            description="Texto sobre primary"
          />
          <ColorSwatch
            name="Accent"
            variable="bg-accent"
            className="bg-accent"
            description="Acentos dorados"
          />
          <ColorSwatch
            name="Accent Foreground"
            variable="text-accent-foreground"
            className="bg-accent-foreground"
            description="Texto sobre accent"
          />
          <ColorSwatch
            name="Secondary"
            variable="bg-secondary"
            className="bg-secondary"
            description="Elementos secundarios"
          />
          <ColorSwatch
            name="Secondary Foreground"
            variable="text-secondary-foreground"
            className="bg-secondary-foreground"
            description="Texto sobre secondary"
          />
        </ColorSection>

        {/* Primary Opacities */}
        <ColorSection 
          title="Primary con Opacidades" 
          description="Variaciones del color primario para diferentes contextos"
        >
          <ColorSwatch
            name="Primary 100%"
            variable="bg-primary"
            className="bg-primary"
          />
          <ColorSwatch
            name="Primary 80%"
            variable="bg-primary/80"
            className="bg-primary/80"
          />
          <ColorSwatch
            name="Primary 60%"
            variable="bg-primary/60"
            className="bg-primary/60"
          />
          <ColorSwatch
            name="Primary 40%"
            variable="bg-primary/40"
            className="bg-primary/40"
          />
          <ColorSwatch
            name="Primary 20%"
            variable="bg-primary/20"
            className="bg-primary/20"
          />
          <ColorSwatch
            name="Primary 10%"
            variable="bg-primary/10"
            className="bg-primary/10"
          />
        </ColorSection>

        {/* Semantic States */}
        <ColorSection 
          title="Estados Semánticos" 
          description="Colores para estados de éxito, advertencia, error e información"
        >
          <ColorSwatch
            name="Success"
            variable="bg-success"
            className="bg-success"
            description="Éxito, confirmado"
          />
          <ColorSwatch
            name="Success 20%"
            variable="bg-success/20"
            className="bg-success/20"
            description="Fondo de éxito"
          />
          <ColorSwatch
            name="Warning"
            variable="bg-warning"
            className="bg-warning"
            description="Advertencia, pendiente"
          />
          <ColorSwatch
            name="Warning 20%"
            variable="bg-warning/20"
            className="bg-warning/20"
            description="Fondo de advertencia"
          />
          <ColorSwatch
            name="Destructive"
            variable="bg-destructive"
            className="bg-destructive"
            description="Error, eliminar"
          />
          <ColorSwatch
            name="Destructive 20%"
            variable="bg-destructive/20"
            className="bg-destructive/20"
            description="Fondo de error"
          />
          <ColorSwatch
            name="Info"
            variable="bg-info"
            className="bg-info"
            description="Información"
          />
          <ColorSwatch
            name="Info 20%"
            variable="bg-info/20"
            className="bg-info/20"
            description="Fondo de info"
          />
        </ColorSection>

        {/* Borders & Rings */}
        <ColorSection 
          title="Bordes y Anillos" 
          description="Colores para bordes, separadores y estados de focus"
        >
          <ColorSwatch
            name="Border"
            variable="border-border"
            className="bg-border"
            description="Bordes generales"
          />
          <ColorSwatch
            name="Input"
            variable="border-input"
            className="bg-input"
            description="Bordes de inputs"
          />
          <ColorSwatch
            name="Ring"
            variable="ring-ring"
            className="bg-ring"
            description="Anillos de focus"
          />
        </ColorSection>

        {/* Gradients */}
        <ColorSection 
          title="Gradientes de Marca" 
          description="Combinaciones de gradientes predefinidas"
        >
          <div className="col-span-2">
            <div className="h-20 rounded-lg bg-gradient-to-r from-primary via-primary/80 to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-sm">
                from-primary via-primary/80 to-accent
              </span>
            </div>
            <p className="mt-2 text-sm font-medium">Gradiente Principal</p>
            <p className="text-xs text-muted-foreground font-mono">bg-gradient-to-r from-primary via-primary/80 to-accent</p>
          </div>
          <div className="col-span-2">
            <div className="h-20 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-sm">
                from-primary to-accent
              </span>
            </div>
            <p className="mt-2 text-sm font-medium">Gradiente Diagonal</p>
            <p className="text-xs text-muted-foreground font-mono">bg-gradient-to-br from-primary to-accent</p>
          </div>
          <div className="col-span-2">
            <div className="h-20 rounded-lg bg-gradient-to-r from-background via-muted to-background flex items-center justify-center border border-border/50">
              <span className="text-foreground font-medium text-sm">
                from-background via-muted to-background
              </span>
            </div>
            <p className="mt-2 text-sm font-medium">Gradiente Sutil</p>
            <p className="text-xs text-muted-foreground font-mono">bg-gradient-to-r from-background via-muted to-background</p>
          </div>
        </ColorSection>

        {/* Usage Examples */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Ejemplos de Uso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Button Examples */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <h4 className="font-medium text-card-foreground">Botones</h4>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Primary
                </button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                  Secondary
                </button>
                <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">
                  Destructive
                </button>
              </div>
            </div>

            {/* Badge Examples */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <h4 className="font-medium text-card-foreground">Badges</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-success/20 text-success border border-success/50 rounded-full text-xs font-medium">
                  Confirmado
                </span>
                <span className="px-3 py-1 bg-warning/20 text-warning border border-warning/50 rounded-full text-xs font-medium">
                  Pendiente
                </span>
                <span className="px-3 py-1 bg-destructive/20 text-destructive border border-destructive/50 rounded-full text-xs font-medium">
                  Cancelado
                </span>
                <span className="px-3 py-1 bg-info/20 text-info border border-info/50 rounded-full text-xs font-medium">
                  Info
                </span>
              </div>
            </div>

            {/* Card Example */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <h4 className="font-medium text-card-foreground">Tarjeta</h4>
              <div className="p-4 rounded-lg bg-muted border border-border">
                <p className="text-sm text-muted-foreground">
                  Contenido dentro de una tarjeta con fondo muted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            Sistema de diseño "Negro & Esmeralda" • Sortavo 2024
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;
