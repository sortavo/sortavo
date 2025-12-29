import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  HelpCircle, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Check,
  Package,
  Truck,
  CreditCard,
  Clock,
  MapPin,
  Gift,
  Phone,
  RefreshCw,
  Trophy,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

interface FAQEditorProps {
  form: UseFormReturn<any>;
}

// FAQ Categories
const FAQ_CATEGORIES = [
  { id: 'shipping', label: 'Envío', icon: Truck, color: 'bg-blue-500' },
  { id: 'payment', label: 'Pagos', icon: CreditCard, color: 'bg-green-500' },
  { id: 'prize', label: 'Premio', icon: Trophy, color: 'bg-amber-500' },
  { id: 'participation', label: 'Participación', icon: HelpCircle, color: 'bg-purple-500' },
  { id: 'trust', label: 'Garantías', icon: ShieldCheck, color: 'bg-teal-500' },
  { id: 'other', label: 'Otros', icon: Package, color: 'bg-gray-500' },
] as const;

type CategoryId = typeof FAQ_CATEGORIES[number]['id'];

// Quick FAQ suggestions that organizers commonly need
const FAQ_SUGGESTIONS: Array<{
  id: string;
  label: string;
  icon: typeof Truck;
  question: string;
  answer: string;
  category: CategoryId;
}> = [
  {
    id: 'shipping',
    label: 'Envío',
    icon: Truck,
    question: '¿Hacen envíos?',
    answer: 'Sí, hacemos envíos a todo el país. El costo y tiempo de envío dependerá de tu ubicación.',
    category: 'shipping'
  },
  {
    id: 'delivery-time',
    label: 'Tiempo',
    icon: Clock,
    question: '¿Cuánto tarda el envío?',
    answer: 'El envío tarda de 3 a 7 días hábiles dependiendo de tu ubicación.',
    category: 'shipping'
  },
  {
    id: 'pickup',
    label: 'Recoger',
    icon: MapPin,
    question: '¿Puedo recoger el premio en persona?',
    answer: 'Sí, puedes recoger el premio en nuestra ubicación previa coordinación.',
    category: 'shipping'
  },
  {
    id: 'refund',
    label: 'Reembolso',
    icon: RefreshCw,
    question: '¿Hay reembolsos?',
    answer: 'Los boletos no son reembolsables una vez comprados, según nuestros términos y condiciones.',
    category: 'payment'
  },
  {
    id: 'payment-deadline',
    label: 'Plazo pago',
    icon: CreditCard,
    question: '¿Cuánto tiempo tengo para pagar?',
    answer: 'Tienes el tiempo indicado en tu reserva para completar el pago. Si no pagas a tiempo, los boletos quedarán disponibles nuevamente.',
    category: 'payment'
  },
  {
    id: 'prize-exchange',
    label: 'Cambio',
    icon: Gift,
    question: '¿Puedo cambiar el premio por dinero?',
    answer: 'No, el premio no es canjeable por dinero en efectivo.',
    category: 'prize'
  },
  {
    id: 'contact',
    label: 'Contacto',
    icon: Phone,
    question: '¿Cómo los contacto para dudas?',
    answer: 'Puedes contactarnos por WhatsApp o por las redes sociales indicadas en esta página.',
    category: 'other'
  },
  {
    id: 'packages',
    label: 'Paquetes',
    icon: Package,
    question: '¿Hay promociones por varios boletos?',
    answer: 'Sí, ofrecemos paquetes con descuento. Consulta las opciones disponibles al momento de comprar.',
    category: 'participation'
  }
];

export const FAQEditor = ({ form }: FAQEditorProps) => {
  const customization = form.watch('customization') || {};
  const sections = customization.sections || {};
  const faqConfig = customization.faq_config || { show_default_faqs: true, custom_faqs: [] };
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryId>('other');
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryId>('other');

  const showFaqSection = sections.faq !== false;
  const showDefaultFaqs = faqConfig.show_default_faqs !== false;
  const customFaqs: FAQItem[] = faqConfig.custom_faqs || [];

  const updateCustomization = (key: string, value: unknown) => {
    const current = form.getValues('customization') || {};
    form.setValue('customization', { ...current, [key]: value });
  };

  const updateSections = (key: string, value: boolean) => {
    const currentSections = customization.sections || {};
    updateCustomization('sections', { ...currentSections, [key]: value });
  };

  const updateFaqConfig = (updates: Partial<typeof faqConfig>) => {
    updateCustomization('faq_config', { ...faqConfig, ...updates });
  };

  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    const newFaq: FAQItem = { 
      question: newQuestion.trim(), 
      answer: newAnswer.trim(),
      category: newCategory 
    };
    updateFaqConfig({ custom_faqs: [...customFaqs, newFaq] });
    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('other');
    setIsAdding(false);
  };

  const handleAddSuggestion = (suggestion: typeof FAQ_SUGGESTIONS[0]) => {
    const exists = customFaqs.some(
      faq => faq.question.toLowerCase() === suggestion.question.toLowerCase()
    );
    if (exists) return;
    
    const newFaq: FAQItem = { 
      question: suggestion.question, 
      answer: suggestion.answer,
      category: suggestion.category 
    };
    updateFaqConfig({ custom_faqs: [...customFaqs, newFaq] });
  };

  const handleEditFaq = (index: number) => {
    setEditingIndex(index);
    setEditQuestion(customFaqs[index].question);
    setEditAnswer(customFaqs[index].answer);
    setEditCategory((customFaqs[index].category as CategoryId) || 'other');
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editQuestion.trim() || !editAnswer.trim()) return;
    
    const updatedFaqs = [...customFaqs];
    updatedFaqs[editingIndex] = { 
      question: editQuestion.trim(), 
      answer: editAnswer.trim(),
      category: editCategory 
    };
    updateFaqConfig({ custom_faqs: updatedFaqs });
    setEditingIndex(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditCategory('other');
  };

  const handleDeleteFaq = (index: number) => {
    const updatedFaqs = customFaqs.filter((_, i) => i !== index);
    updateFaqConfig({ custom_faqs: updatedFaqs });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditCategory('other');
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('other');
  };

  const getAddedSuggestionIds = () => {
    return FAQ_SUGGESTIONS.filter(suggestion =>
      customFaqs.some(faq => 
        faq.question.toLowerCase() === suggestion.question.toLowerCase()
      )
    ).map(s => s.id);
  };

  const addedSuggestionIds = getAddedSuggestionIds();

  const getCategoryInfo = (categoryId: string) => {
    return FAQ_CATEGORIES.find(c => c.id === categoryId) || FAQ_CATEGORIES[5]; // default to 'other'
  };

  // Group FAQs by category for display
  const groupedFaqs = customFaqs.reduce((acc, faq, index) => {
    const cat = faq.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...faq, originalIndex: index });
    return acc;
  }, {} as Record<string, Array<FAQItem & { originalIndex: number }>>);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Preguntas Frecuentes
        </CardTitle>
        <CardDescription>
          Personaliza las preguntas que verán los compradores (opcional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              showFaqSection ? "bg-primary/10" : "bg-muted"
            )}>
              <HelpCircle className={cn(
                "w-5 h-5",
                showFaqSection ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <Label className="font-medium">Mostrar sección de FAQ</Label>
              <p className="text-sm text-muted-foreground">
                Activa para mostrar preguntas frecuentes en tu página
              </p>
            </div>
          </div>
          <Switch
            checked={showFaqSection}
            onCheckedChange={(checked) => updateSections('faq', checked)}
          />
        </div>

        {showFaqSection && (
          <>
            <Separator />
            
            {/* Include default FAQs */}
            <div className="flex items-center space-x-3 p-4 bg-card rounded-lg border border-border">
              <Checkbox
                id="show_default_faqs"
                checked={showDefaultFaqs}
                onCheckedChange={(checked) => updateFaqConfig({ show_default_faqs: !!checked })}
              />
              <div>
                <label htmlFor="show_default_faqs" className="text-sm font-medium cursor-pointer">
                  Incluir preguntas automáticas
                </label>
                <p className="text-xs text-muted-foreground">
                  Se generan automáticamente basadas en la información de tu sorteo
                </p>
              </div>
            </div>

            {/* Category legend */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categorías disponibles</Label>
              <div className="flex flex-wrap gap-2">
                {FAQ_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Badge 
                      key={cat.id} 
                      variant="outline" 
                      className="gap-1.5 text-xs"
                    >
                      <span className={cn("w-2 h-2 rounded-full", cat.color)} />
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Quick add suggestions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Agregar pregunta rápida</Label>
              <div className="flex flex-wrap gap-2">
                {FAQ_SUGGESTIONS.map((suggestion) => {
                  const isAdded = addedSuggestionIds.includes(suggestion.id);
                  const Icon = suggestion.icon;
                  const catInfo = getCategoryInfo(suggestion.category);
                  return (
                    <Button
                      key={suggestion.id}
                      type="button"
                      variant={isAdded ? "secondary" : "outline"}
                      size="sm"
                      className={cn(
                        "gap-1.5 text-xs",
                        isAdded && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => !isAdded && handleAddSuggestion(suggestion)}
                      disabled={isAdded}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", catInfo.color)} />
                      <Icon className="w-3.5 h-3.5" />
                      {suggestion.label}
                      {isAdded && <Check className="w-3 h-3 ml-1" />}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Custom FAQs section - grouped by category */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tus preguntas personalizadas</Label>
                <Badge variant="secondary" className="text-xs">
                  {customFaqs.length} {customFaqs.length === 1 ? 'pregunta' : 'preguntas'}
                </Badge>
              </div>

              {customFaqs.length > 0 && (
                <div className="space-y-4">
                  {FAQ_CATEGORIES.filter(cat => groupedFaqs[cat.id]?.length > 0).map((cat) => {
                    const Icon = cat.icon;
                    const faqs = groupedFaqs[cat.id] || [];
                    
                    return (
                      <div key={cat.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", cat.color)} />
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">{cat.label}</span>
                          <span className="text-xs text-muted-foreground">({faqs.length})</span>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                          {faqs.map((faq) => (
                            <div 
                              key={faq.originalIndex} 
                              className="bg-card rounded-lg border border-border overflow-hidden"
                            >
                              {editingIndex === faq.originalIndex ? (
                                <div className="p-4 space-y-3">
                                  <Input
                                    placeholder="Pregunta"
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    className="font-medium"
                                  />
                                  <Textarea
                                    placeholder="Respuesta"
                                    value={editAnswer}
                                    onChange={(e) => setEditAnswer(e.target.value)}
                                    rows={3}
                                  />
                                  <Select value={editCategory} onValueChange={(v) => setEditCategory(v as CategoryId)}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FAQ_CATEGORIES.map((c) => {
                                        const CatIcon = c.icon;
                                        return (
                                          <SelectItem key={c.id} value={c.id}>
                                            <div className="flex items-center gap-2">
                                              <span className={cn("w-2 h-2 rounded-full", c.color)} />
                                              <CatIcon className="w-4 h-4" />
                                              {c.label}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                                      <X className="w-4 h-4 mr-1" />Cancelar
                                    </Button>
                                    <Button type="button" size="sm" onClick={handleSaveEdit} disabled={!editQuestion.trim() || !editAnswer.trim()}>
                                      <Check className="w-4 h-4 mr-1" />Guardar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-foreground truncate">P: {faq.question}</p>
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">R: {faq.answer}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditFaq(faq.originalIndex)}>
                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                      </Button>
                                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteFaq(faq.originalIndex)}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add new FAQ form */}
              {isAdding ? (
                <div className="bg-card rounded-lg border border-primary/20 p-4 space-y-3">
                  <Input
                    placeholder="Escribe la pregunta..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="font-medium"
                  />
                  <Textarea
                    placeholder="Escribe la respuesta..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    rows={3}
                  />
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as CategoryId)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map((c) => {
                        const CatIcon = c.icon;
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", c.color)} />
                              <CatIcon className="w-4 h-4" />
                              {c.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={handleCancelAdd}>
                      <X className="w-4 h-4 mr-1" />Cancelar
                    </Button>
                    <Button type="button" size="sm" onClick={handleAddFaq} disabled={!newQuestion.trim() || !newAnswer.trim()}>
                      <Plus className="w-4 h-4 mr-1" />Agregar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
                  <Plus className="w-4 h-4 mr-2" />Escribir pregunta personalizada
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
