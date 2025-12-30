import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface TelegramOptInProps {
  buyerEmail: string;
  organizationHasTelegram?: boolean;
}

export function TelegramOptIn({ buyerEmail, organizationHasTelegram = false }: TelegramOptInProps) {
  if (!organizationHasTelegram || !buyerEmail) {
    return null;
  }

  const emailBase64 = btoa(buyerEmail);
  const telegramLink = `https://t.me/SortavoBot?start=buyer_${emailBase64}`;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => window.open(telegramLink, "_blank")}
    >
      <Send className="h-4 w-4" />
      Recibe actualizaciones por Telegram
    </Button>
  );
}
