import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Link2, Unlink, Copy, Check, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getSubscriptionLimits, SubscriptionTier } from "@/lib/subscription-limits";

interface TelegramConnection {
  id: string;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  link_code: string | null;
  link_code_expires_at: string | null;
  verified_at: string | null;
  notify_ticket_reserved: boolean;
  notify_payment_proof: boolean;
  notify_payment_approved: boolean;
  notify_payment_rejected: boolean;
  notify_reservation_expired: boolean;
  notify_raffle_ending: boolean;
  notify_daily_summary: boolean;
  daily_summary_hour: number;
  notify_winner_selected: boolean;
}

export function TelegramSettings() {
  const { user, organization } = useAuth();
  const [connection, setConnection] = useState<TelegramConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const subscriptionTier = (organization?.subscription_tier as SubscriptionTier) || "basic";
  const limits = getSubscriptionLimits(subscriptionTier);
  const hasTelegramAccess = limits.hasTelegramBot;

  useEffect(() => {
    if (organization?.id) {
      fetchConnection();
    }
  }, [organization?.id]);

  const fetchConnection = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("telegram_connections")
      .select("*")
      .eq("organization_id", organization.id)
      .maybeSingle();

    if (!error && data) {
      setConnection(data as TelegramConnection);
    }
    setIsLoading(false);
  };

  const generateLinkCode = async () => {
    if (!organization?.id) return;
    
    setIsGenerating(true);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const { data, error } = await supabase
      .from("telegram_connections")
      .upsert({
        organization_id: organization.id,
        link_code: code,
        link_code_expires_at: expiresAt,
        telegram_chat_id: connection?.telegram_chat_id || `pending_${Date.now()}`,
      }, { onConflict: "organization_id" })
      .select()
      .single();

    if (error) {
      toast.error("Error al generar código");
    } else {
      setConnection(data as TelegramConnection);
      toast.success("Código generado. Expira en 10 minutos.");
    }
    setIsGenerating(false);
  };

  const copyCode = () => {
    if (connection?.link_code) {
      navigator.clipboard.writeText(connection.link_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Código copiado");
    }
  };

  const unlinkTelegram = async () => {
    if (!connection?.id) return;
    
    const { error } = await supabase
      .from("telegram_connections")
      .delete()
      .eq("id", connection.id);

    if (error) {
      toast.error("Error al desvincular");
    } else {
      setConnection(null);
      toast.success("Cuenta desvinculada");
    }
  };

  const updatePreference = async (field: string, value: boolean) => {
    if (!connection?.id) return;
    
    setIsSaving(true);
    const { error } = await supabase
      .from("telegram_connections")
      .update({ [field]: value })
      .eq("id", connection.id);

    if (error) {
      toast.error("Error al guardar preferencia");
    } else {
      setConnection({ ...connection, [field]: value });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasTelegramAccess) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Bot de Telegram</CardTitle>
          <CardDescription>
            Recibe notificaciones de ventas y pagos directamente en Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Esta función está disponible en los planes <strong>Premium</strong> y <strong>Enterprise</strong>.
          </p>
          <Button asChild>
            <a href="/pricing">Ver Planes</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isLinked = connection?.verified_at && connection?.telegram_chat_id && !connection.telegram_chat_id.startsWith("pending_");

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Bot de Telegram
              </CardTitle>
              <CardDescription>
                Recibe notificaciones en tiempo real sobre ventas y pagos
              </CardDescription>
            </div>
            {isLinked && (
              <Badge variant="default" className="bg-green-500">
                Conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLinked ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted">
              <div className="min-w-0">
                <p className="font-medium truncate">@{connection.telegram_username || "Usuario"}</p>
                <p className="text-sm text-muted-foreground">
                  Conectado desde {new Date(connection.verified_at!).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={unlinkTelegram} className="w-full sm:w-auto shrink-0">
                <Unlink className="h-4 w-4 mr-2" />
                Desvincular
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Link2 className="h-4 w-4" />
                <AlertDescription>
                  Genera un código y envíalo al bot @SortavoBot en Telegram con el comando /vincular
                </AlertDescription>
              </Alert>

              {connection?.link_code && new Date(connection.link_code_expires_at!) > new Date() ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <code className="text-xl sm:text-2xl font-mono font-bold tracking-wider">
                      {connection.link_code}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyCode} className="shrink-0">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground sm:ml-auto">
                    Expira en {Math.ceil((new Date(connection.link_code_expires_at!).getTime() - Date.now()) / 60000)} min
                  </span>
                </div>
              ) : (
                <Button onClick={generateLinkCode} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Generar Código de Vinculación
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      {isLinked && (
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Notificación</CardTitle>
            <CardDescription>
              Personaliza qué notificaciones quieres recibir en Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Ventas</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_ticket_reserved">Boletos reservados</Label>
                  <Switch
                    id="notify_ticket_reserved"
                    checked={connection.notify_ticket_reserved}
                    onCheckedChange={(v) => updatePreference("notify_ticket_reserved", v)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_reservation_expired">Reservas expiradas</Label>
                  <Switch
                    id="notify_reservation_expired"
                    checked={connection.notify_reservation_expired}
                    onCheckedChange={(v) => updatePreference("notify_reservation_expired", v)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Pagos</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_payment_proof">Comprobante recibido</Label>
                  <Switch
                    id="notify_payment_proof"
                    checked={connection.notify_payment_proof}
                    onCheckedChange={(v) => updatePreference("notify_payment_proof", v)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_payment_approved">Pago aprobado</Label>
                  <Switch
                    id="notify_payment_approved"
                    checked={connection.notify_payment_approved}
                    onCheckedChange={(v) => updatePreference("notify_payment_approved", v)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_payment_rejected">Pago rechazado</Label>
                  <Switch
                    id="notify_payment_rejected"
                    checked={connection.notify_payment_rejected}
                    onCheckedChange={(v) => updatePreference("notify_payment_rejected", v)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Sorteos</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_raffle_ending">Sorteo por terminar (24h)</Label>
                  <Switch
                    id="notify_raffle_ending"
                    checked={connection.notify_raffle_ending}
                    onCheckedChange={(v) => updatePreference("notify_raffle_ending", v)}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_winner_selected">Ganador seleccionado</Label>
                  <Switch
                    id="notify_winner_selected"
                    checked={connection.notify_winner_selected}
                    onCheckedChange={(v) => updatePreference("notify_winner_selected", v)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
