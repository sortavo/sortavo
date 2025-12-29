import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { Badge } from './badge';
import { useState } from 'react';
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield,
  BarChart3,
  Ticket,
  Users,
  FileText,
  Image
} from 'lucide-react';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Make changes to your account here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
        <TabsTrigger value="billing" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Billing</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Alerts</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">Manage your profile information.</p>
        </div>
      </TabsContent>
      <TabsContent value="settings" className="mt-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">General Settings</h3>
          <p className="text-sm text-muted-foreground">Configure application preferences.</p>
        </div>
      </TabsContent>
      <TabsContent value="billing" className="mt-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Billing Information</h3>
          <p className="text-sm text-muted-foreground">Manage your subscription and payment methods.</p>
        </div>
      </TabsContent>
      <TabsContent value="notifications" className="mt-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">Choose what notifications you receive.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const Controlled: Story = {
  render: function ControlledTabs() {
    const [activeTab, setActiveTab] = useState('tab1');
    
    return (
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="rounded-lg border p-4">
            Content for Tab 1
          </TabsContent>
          <TabsContent value="tab2" className="rounded-lg border p-4">
            Content for Tab 2
          </TabsContent>
          <TabsContent value="tab3" className="rounded-lg border p-4">
            Content for Tab 3
          </TabsContent>
        </Tabs>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setActiveTab('tab1')}>
            Go to Tab 1
          </Button>
          <Button size="sm" variant="outline" onClick={() => setActiveTab('tab2')}>
            Go to Tab 2
          </Button>
          <Button size="sm" variant="outline" onClick={() => setActiveTab('tab3')}>
            Go to Tab 3
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Active tab: <strong>{activeTab}</strong>
        </p>
      </div>
    );
  },
};

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="all" className="flex items-center gap-2">
          All
          <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
            128
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pending" className="flex items-center gap-2">
          Pending
          <Badge className="ml-1 bg-yellow-500 px-1.5 py-0.5 text-xs">
            12
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="approved" className="flex items-center gap-2">
          Approved
          <Badge className="ml-1 bg-green-500 px-1.5 py-0.5 text-xs">
            98
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="rejected" className="flex items-center gap-2">
          Rejected
          <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
            18
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-4 rounded-lg border p-4">
        Showing all 128 tickets
      </TabsContent>
      <TabsContent value="pending" className="mt-4 rounded-lg border p-4">
        Showing 12 pending tickets
      </TabsContent>
      <TabsContent value="approved" className="mt-4 rounded-lg border p-4">
        Showing 98 approved tickets
      </TabsContent>
      <TabsContent value="rejected" className="mt-4 rounded-lg border p-4">
        Showing 18 rejected tickets
      </TabsContent>
    </Tabs>
  ),
};

export const VerticalStyle: Story = {
  render: () => (
    <div className="flex w-[600px] gap-4">
      <Tabs defaultValue="overview" orientation="vertical" className="flex w-full gap-4">
        <TabsList className="flex h-auto flex-col items-stretch gap-1 bg-transparent p-0">
          <TabsTrigger 
            value="overview" 
            className="justify-start data-[state=active]:bg-muted"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="tickets" 
            className="justify-start data-[state=active]:bg-muted"
          >
            <Ticket className="mr-2 h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger 
            value="buyers" 
            className="justify-start data-[state=active]:bg-muted"
          >
            <Users className="mr-2 h-4 w-4" />
            Buyers
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="justify-start data-[state=active]:bg-muted"
          >
            <FileText className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="overview" className="m-0 rounded-lg border p-4">
            <h3 className="font-medium">Overview</h3>
            <p className="text-sm text-muted-foreground">
              General overview of your raffle performance.
            </p>
          </TabsContent>
          <TabsContent value="tickets" className="m-0 rounded-lg border p-4">
            <h3 className="font-medium">Tickets</h3>
            <p className="text-sm text-muted-foreground">
              Manage all your tickets here.
            </p>
          </TabsContent>
          <TabsContent value="buyers" className="m-0 rounded-lg border p-4">
            <h3 className="font-medium">Buyers</h3>
            <p className="text-sm text-muted-foreground">
              View and manage your buyers.
            </p>
          </TabsContent>
          <TabsContent value="analytics" className="m-0 rounded-lg border p-4">
            <h3 className="font-medium">Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Detailed analytics and reports.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ),
};

export const RaffleDetailTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[600px]">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="buyers">Buyers</TabsTrigger>
        <TabsTrigger value="approvals">
          Approvals
          <Badge className="ml-2 bg-orange-500 px-1.5 text-xs">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 pt-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tickets Sold</CardDescription>
              <CardTitle className="text-2xl">234 / 500</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Revenue</CardDescription>
              <CardTitle className="text-2xl">$2,340</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Days Left</CardDescription>
              <CardTitle className="text-2xl">12</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="tickets" className="pt-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Ticket grid would go here...</p>
        </div>
      </TabsContent>
      <TabsContent value="buyers" className="pt-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Buyers list would go here...</p>
        </div>
      </TabsContent>
      <TabsContent value="approvals" className="pt-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Pending approvals would go here...</p>
        </div>
      </TabsContent>
      <TabsContent value="analytics" className="pt-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground">Charts and analytics would go here...</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const DisabledTabs: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="disabled1" disabled>
          <Shield className="mr-1 h-3 w-3" />
          Pro Only
        </TabsTrigger>
        <TabsTrigger value="another">Another</TabsTrigger>
        <TabsTrigger value="disabled2" disabled>
          Coming Soon
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="rounded-lg border p-4">
        This tab is active and accessible.
      </TabsContent>
      <TabsContent value="another" className="rounded-lg border p-4">
        This tab is also accessible.
      </TabsContent>
    </Tabs>
  ),
};
