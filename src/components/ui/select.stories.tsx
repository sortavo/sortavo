import type { Meta, StoryObj } from '@storybook/react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
import { Label } from './label';
import { useState } from 'react';
import { 
  Globe, 
  CreditCard, 
  Building2, 
  User, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Palette
} from 'lucide-react';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="framework">Framework</Label>
      <Select>
        <SelectTrigger id="framework">
          <SelectValue placeholder="Select framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="react">React</SelectItem>
          <SelectItem value="vue">Vue</SelectItem>
          <SelectItem value="angular">Angular</SelectItem>
          <SelectItem value="svelte">Svelte</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
          <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Asia</SelectLabel>
          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
          <SelectItem value="cst-asia">China Standard Time (CST)</SelectItem>
          <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Controlled: Story = {
  render: function ControlledSelect() {
    const [value, setValue] = useState('');
    return (
      <div className="space-y-4">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">🍎 Apple</SelectItem>
            <SelectItem value="banana">🍌 Banana</SelectItem>
            <SelectItem value="orange">🍊 Orange</SelectItem>
            <SelectItem value="grape">🍇 Grape</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Selected: <strong>{value || 'None'}</strong>
        </p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Disabled select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
      
      <Select>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Some options disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active option</SelectItem>
          <SelectItem value="disabled1" disabled>Disabled option 1</SelectItem>
          <SelectItem value="another">Another active</SelectItem>
          <SelectItem value="disabled2" disabled>Disabled option 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const StatusSelect: Story = {
  render: function StatusSelect() {
    const [status, setStatus] = useState('pending');
    
    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
      approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
      rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
      review: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    };
    
    const current = statusConfig[status as keyof typeof statusConfig];
    const Icon = current.icon;
    
    return (
      <div className="space-y-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className={`w-[200px] ${current.bg}`}>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${current.color}`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending
              </div>
            </SelectItem>
            <SelectItem value="approved">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Approved
              </div>
            </SelectItem>
            <SelectItem value="rejected">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Rejected
              </div>
            </SelectItem>
            <SelectItem value="review">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Under Review
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  },
};

export const CountrySelect: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[250px]">
        <Globe className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Select country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="mx">🇲🇽 Mexico</SelectItem>
        <SelectItem value="us">🇺🇸 United States</SelectItem>
        <SelectItem value="ca">🇨🇦 Canada</SelectItem>
        <SelectItem value="es">🇪🇸 Spain</SelectItem>
        <SelectItem value="ar">🇦🇷 Argentina</SelectItem>
        <SelectItem value="co">🇨🇴 Colombia</SelectItem>
        <SelectItem value="pe">🇵🇪 Peru</SelectItem>
        <SelectItem value="cl">🇨🇱 Chile</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const PaymentMethodSelect: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select payment method" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Cards</SelectLabel>
          <SelectItem value="visa">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Visa ending in 4242
            </div>
          </SelectItem>
          <SelectItem value="mastercard">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Mastercard ending in 8888
            </div>
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Bank Transfer</SelectLabel>
          <SelectItem value="bank1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              BBVA - **** 1234
            </div>
          </SelectItem>
          <SelectItem value="bank2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Santander - **** 5678
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const ThemeSelect: Story = {
  render: function ThemeSelect() {
    const [theme, setTheme] = useState('system');
    
    return (
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-[180px]">
          <Palette className="mr-2 h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">☀️ Light</SelectItem>
          <SelectItem value="dark">🌙 Dark</SelectItem>
          <SelectItem value="system">💻 System</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

export const FormExample: Story = {
  render: () => (
    <div className="w-[350px] space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Create Raffle</h3>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tech">Technology</SelectItem>
            <SelectItem value="travel">Travel</SelectItem>
            <SelectItem value="home">Home & Garden</SelectItem>
            <SelectItem value="fashion">Fashion</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Select defaultValue="mxn">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mxn">🇲🇽 MXN - Mexican Peso</SelectItem>
            <SelectItem value="usd">🇺🇸 USD - US Dollar</SelectItem>
            <SelectItem value="eur">🇪🇺 EUR - Euro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Draw Method</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="random">Random Selection</SelectItem>
            <SelectItem value="lottery">National Lottery</SelectItem>
            <SelectItem value="manual">Manual Draw</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};
