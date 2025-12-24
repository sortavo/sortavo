import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMyTickets } from "@/hooks/usePublicRaffle";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Ticket, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email || '');
  const [searchEmail, setSearchEmail] = useState(user?.email || '');

  const { data: tickets, isLoading } = useMyTickets(searchEmail);

  const handleSearch = () => {
    setSearchEmail(email);
  };

  const groupedTickets = tickets?.reduce((acc, ticket) => {
    const raffleId = ticket.raffles?.id || 'unknown';
    if (!acc[raffleId]) {
      acc[raffleId] = { raffle: ticket.raffles, tickets: [] };
    }
    acc[raffleId].tickets.push(ticket);
    return acc;
  }, {} as Record<string, { raffle: typeof tickets[0]['raffles']; tickets: typeof tickets }>);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Mis Boletos</h1>

        {/* Email Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Ingresa tu email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !searchEmail ? (
          <p className="text-center text-muted-foreground py-12">
            Ingresa tu email para ver tus boletos
          </p>
        ) : !tickets?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No se encontraron boletos</p>
            </CardContent>
          </Card>
        ) : (
          Object.values(groupedTickets || {}).map(({ raffle, tickets: raffleTickets }) => (
            <Card key={raffle?.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{raffle?.title}</span>
                  <Badge variant={raffle?.status === 'active' ? 'default' : 'secondary'}>
                    {raffle?.status}
                  </Badge>
                </CardTitle>
                {raffle?.draw_date && (
                  <p className="text-sm text-muted-foreground">
                    Sorteo: {format(new Date(raffle.draw_date), "dd MMM yyyy HH:mm", { locale: es })}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {raffleTickets.map(t => (
                    <Badge key={t.id} variant={t.status === 'sold' ? 'default' : 'secondary'}>
                      #{t.ticket_number} - {t.status === 'sold' ? 'Confirmado' : 'Pendiente'}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/r/${raffle?.slug}`)}>
                  Ver Sorteo
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
