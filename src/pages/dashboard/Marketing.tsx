import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tag, Users, Megaphone } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ReferralProgram } from '@/components/marketing/ReferralProgram';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Marketing() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">
            Herramientas para promocionar tus sorteos y atraer más compradores
          </p>
        </div>

        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="referrals" className="gap-2">
              <Users className="w-4 h-4" />
              Referidos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="w-4 h-4" />
              Campañas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals">
            <ReferralProgram />
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Campañas Promocionales</CardTitle>
                <CardDescription>
                  Próximamente: Crea campañas de marketing para tus sorteos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Esta funcionalidad estará disponible próximamente</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
