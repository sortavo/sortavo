import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, Download, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LogoPreview = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState<string>("");

  const generateLogo = async () => {
    setIsGenerating(true);
    setLogoUrl(null);
    setDescription("");

    try {
      const { data, error } = await supabase.functions.invoke('generate-logo');

      if (error) {
        console.error('Error invoking function:', error);
        toast.error('Error al generar el logo: ' + error.message);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setLogoUrl(data.imageUrl);
      setDescription(data.description || '');
      toast.success('Logo generado exitosamente');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error inesperado al generar el logo');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLogo = () => {
    if (!logoUrl) return;

    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = 'sortavo-logo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logo descargado');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Generador de Logo - Sortavo</CardTitle>
          <CardDescription>
            Genera un logo tipográfico moderno y minimalista con colores vibrantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview Area */}
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p>Generando logo con IA...</p>
                <p className="text-sm">Esto puede tomar unos segundos</p>
              </div>
            ) : logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Sortavo Logo Preview" 
                className="max-w-full max-h-full object-contain p-4"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">Sin logo generado</p>
                <p className="text-sm">Haz clic en "Generar Logo" para crear uno</p>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={generateLogo} 
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : logoUrl ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerar Logo
                </>
              ) : (
                'Generar Logo'
              )}
            </Button>

            {logoUrl && (
              <>
                <Button 
                  variant="outline" 
                  onClick={downloadLogo}
                  size="lg"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                <Button 
                  variant="secondary"
                  size="lg"
                  className="gap-2"
                  onClick={() => toast.info('Para implementar el logo en el proyecto, avísame y lo haré por ti.')}
                >
                  <Check className="h-4 w-4" />
                  Aprobar Logo
                </Button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>El logo se genera usando IA con las siguientes características:</p>
            <ul className="mt-2 space-y-1">
              <li>• Tipografía moderna y minimalista</li>
              <li>• Colores vibrantes multicolor</li>
              <li>• Estilo profesional tech-savvy</li>
              <li>• Solo texto "Sortavo"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoPreview;
