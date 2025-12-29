import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';
import { Badge } from './badge';
import { Button } from './button';
import { useState } from 'react';
import { 
  HelpCircle, 
  CreditCard, 
  Truck, 
  RotateCcw, 
  Shield, 
  Clock,
  ChevronRight,
  Ticket,
  Gift,
  Calendar
} from 'lucide-react';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[450px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other components' aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It's animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-[450px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Can I open multiple items?</AccordionTrigger>
        <AccordionContent>
          Yes! This accordion is set to type="multiple", allowing you to open multiple items at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does it work?</AccordionTrigger>
        <AccordionContent>
          Simply click on any header to toggle it. Other open items will remain open.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is this useful?</AccordionTrigger>
        <AccordionContent>
          Definitely! It's great for FAQs where users might want to compare answers.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-2" collapsible className="w-[450px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>First Item</AccordionTrigger>
        <AccordionContent>
          This is the first item content.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second Item (Default Open)</AccordionTrigger>
        <AccordionContent>
          This item is open by default because we set defaultValue="item-2".
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third Item</AccordionTrigger>
        <AccordionContent>
          This is the third item content.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="payments">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Payment Methods</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          We accept all major credit cards, PayPal, and bank transfers. Payment is processed securely through our payment provider.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="shipping">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" />
            <span>Shipping Information</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          We ship worldwide. Standard shipping takes 5-7 business days. Express shipping is available for an additional fee.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-primary" />
            <span>Returns & Refunds</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          We offer a 30-day return policy. Items must be unused and in original packaging. Refunds are processed within 5-7 business days.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="warranty">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span>Warranty</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          All products come with a 1-year manufacturer warranty. Extended warranty options are available at checkout.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const FAQ: Story = {
  render: () => (
    <div className="w-[550px] space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">Find answers to common questions about our raffles</p>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="how-it-works">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              How do raffles work?
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Our raffles are simple: purchase tickets, wait for the draw date, and if your number is selected, you win! Each ticket gives you an equal chance of winning the prize.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="payment">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              What payment methods do you accept?
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            We accept bank transfers, OXXO payments, PayPal, and major credit/debit cards. All payments are processed securely.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="draw">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              When is the draw?
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Each raffle has a specific draw date shown on its page. The draw is typically conducted live on social media and results are announced immediately.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="prize">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              How do I claim my prize?
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Winners are contacted via email and WhatsApp within 24 hours of the draw. Prize delivery is coordinated directly with the winner.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="tickets">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Can I choose my ticket numbers?
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Yes! You can select specific numbers if they're available, or let the system assign random numbers for you. All numbers have equal chances of winning.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledAccordion() {
    const [openItems, setOpenItems] = useState<string[]>(['item-1']);
    
    return (
      <div className="w-[450px] space-y-4">
        <Accordion 
          type="multiple" 
          value={openItems} 
          onValueChange={setOpenItems}
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content for item 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content for item 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Item 3</AccordionTrigger>
            <AccordionContent>Content for item 3</AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setOpenItems(['item-1', 'item-2', 'item-3'])}
          >
            Open All
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setOpenItems([])}
          >
            Close All
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Open items: <strong>{openItems.length > 0 ? openItems.join(', ') : 'None'}</strong>
        </p>
      </div>
    );
  },
};

export const WithBadges: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="new">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            What's new?
            <Badge className="bg-green-500 text-xs">New</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          Check out our latest features and improvements!
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="popular">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            Most popular questions
            <Badge variant="secondary" className="text-xs">12 questions</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          Here are the questions most frequently asked by our users.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="advanced">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            Advanced settings
            <Badge variant="outline" className="text-xs">Pro</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          Advanced configuration options for power users.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const NestedContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[500px]">
      <AccordionItem value="pricing">
        <AccordionTrigger>Pricing Plans</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Basic</p>
                <p className="text-sm text-muted-foreground">For small raffles</p>
              </div>
              <p className="font-bold">$9/mo</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-3">
              <div>
                <p className="font-medium">Pro</p>
                <p className="text-sm text-muted-foreground">Most popular</p>
              </div>
              <p className="font-bold">$29/mo</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Premium</p>
                <p className="text-sm text-muted-foreground">For large organizations</p>
              </div>
              <p className="font-bold">$99/mo</p>
            </div>
            <Button className="w-full">Compare Plans</Button>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="features">
        <AccordionTrigger>Feature Comparison</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Unlimited raffles
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Custom branding
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Advanced analytics
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Priority support
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Borderless: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[450px]">
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger className="rounded-lg bg-muted/50 px-4 hover:bg-muted hover:no-underline">
          Borderless style
        </AccordionTrigger>
        <AccordionContent className="px-4">
          This accordion item has a card-like appearance without borders.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2" className="border-none">
        <AccordionTrigger className="rounded-lg bg-muted/50 px-4 hover:bg-muted hover:no-underline">
          Another item
        </AccordionTrigger>
        <AccordionContent className="px-4">
          Great for settings panels or feature lists.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" className="border-none">
        <AccordionTrigger className="rounded-lg bg-muted/50 px-4 hover:bg-muted hover:no-underline">
          Final item
        </AccordionTrigger>
        <AccordionContent className="px-4">
          Clean and modern look for your UI.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
