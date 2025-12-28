import { useState, useEffect, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Hash, 
  Settings2, 
  Eye, 
  ChevronDown, 
  Shuffle, 
  ListOrdered, 
  FileSpreadsheet, 
  Sparkles, 
  Lightbulb,
  Ticket,
  Binary,
  Gem,
  Tag,
  Dice5,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NumberingConfig {
  mode: 'sequential' | 'random_permutation' | 'custom_list' | 'template';
  start_number: number;
  step: number;
  pad_enabled: boolean;
  pad_width: number | null;
  pad_char: string;
  prefix: string | null;
  suffix: string | null;
  separator: string;
  range_end: number | null;
  custom_numbers: string[] | null;
}

interface NumberingConfigPanelProps {
  form: UseFormReturn<any>;
  totalTickets: number;
}

// Función para obtener la recomendación basada en cantidad de boletos
function getRecommendedPreset(totalTickets: number): { id: string; reason: string } {
  if (totalTickets <= 99) {
    return { id: 'simple', reason: 'Ideal para rifas pequeñas, números fáciles de recordar' };
  }
  if (totalTickets <= 999) {
    return { id: 'zeros_auto', reason: 'Mejor legibilidad con 3 dígitos (001, 002...)' };
  }
  if (totalTickets <= 9999) {
    return { id: 'zeros_auto', reason: 'Formato limpio de 4 dígitos (0001, 0002...)' };
  }
  if (totalTickets <= 99999) {
    return { id: 'lottery_7', reason: 'Formato profesional para rifas grandes' };
  }
  return { id: 'lottery_7', reason: 'Como boletos de lotería nacional' };
}

// Presets de numeración con iconos más descriptivos
const NUMBERING_PRESETS = [
  {
    id: 'simple',
    name: 'Consecutivo Simple',
    description: 'Sin ceros (1, 2, 3...)',
    icon: ListOrdered,
    iconColor: 'text-blue-500',
    config: {
      mode: 'sequential' as const,
      start_number: 1,
      step: 1,
      pad_enabled: false,
      pad_width: null,
      pad_char: '0',
      prefix: null,
      suffix: null,
      separator: '',
      range_end: null,
    }
  },
  {
    id: 'zeros_auto',
    name: 'Con Ceros (Auto)',
    description: 'Ajusta automáticamente (001, 002...)',
    icon: Binary,
    iconColor: 'text-emerald-500',
    config: {
      mode: 'sequential' as const,
      start_number: 1,
      step: 1,
      pad_enabled: true,
      pad_width: null, // null = auto
      pad_char: '0',
      prefix: null,
      suffix: null,
      separator: '',
      range_end: null,
    }
  },
  {
    id: 'zeros_custom',
    name: 'Con Ceros (Custom)',
    description: 'Tú defines el ancho',
    icon: Settings2,
    iconColor: 'text-violet-500',
    config: {
      mode: 'sequential' as const,
      start_number: 1,
      step: 1,
      pad_enabled: true,
      pad_width: 5,
      pad_char: '0',
      prefix: null,
      suffix: null,
      separator: '',
      range_end: null,
    }
  },
  {
    id: 'lottery_7',
    name: 'Tipo Lotería (7 dígitos)',
    description: 'Como lotería nacional (0000001...)',
    icon: Ticket,
    iconColor: 'text-amber-500',
    config: {
      mode: 'sequential' as const,
      start_number: 1,
      step: 1,
      pad_enabled: true,
      pad_width: 7,
      pad_char: '0',
      prefix: null,
      suffix: null,
      separator: '',
      range_end: null,
    }
  },
  {
    id: 'prefixed',
    name: 'Prefijo + Ceros',
    description: 'TKT-000001, TKT-000002...',
    icon: Tag,
    iconColor: 'text-pink-500',
    config: {
      mode: 'sequential' as const,
      start_number: 1,
      step: 1,
      pad_enabled: true,
      pad_width: 6,
      pad_char: '0',
      prefix: 'TKT',
      suffix: null,
      separator: '-',
      range_end: null,
    }
  },
  {
    id: 'random',
    name: 'Aleatorio Real',
    description: 'Números en orden aleatorio',
    icon: Dice5,
    iconColor: 'text-rose-500',
    config: {
      mode: 'random_permutation' as const,
      start_number: 1,
      step: 1,
      pad_enabled: true,
      pad_width: null,
      pad_char: '0',
      prefix: null,
      suffix: null,
      separator: '',
      range_end: null,
    }
  },
];

// Función para generar preview de números
function generatePreviewNumbers(config: NumberingConfig, totalTickets: number, count: number = 10): string[] {
  const numbers: string[] = [];
  const actualPadWidth = config.pad_width ?? Math.max(3, totalTickets.toString().length);
  
  for (let i = 1; i <= Math.min(count, totalTickets); i++) {
    let displayNumber = config.start_number + (i - 1) * config.step;
    let ticketNumber = displayNumber.toString();
    
    if (config.pad_enabled) {
      ticketNumber = ticketNumber.padStart(actualPadWidth, config.pad_char);
    }
    
    if (config.prefix) {
      ticketNumber = config.prefix + config.separator + ticketNumber;
    }
    
    if (config.suffix) {
      ticketNumber = ticketNumber + config.separator + config.suffix;
    }
    
    numbers.push(ticketNumber);
  }
  
  // Add last number
  if (totalTickets > count) {
    const lastIndex = totalTickets;
    let lastDisplayNumber = config.start_number + (lastIndex - 1) * config.step;
    let lastTicketNumber = lastDisplayNumber.toString();
    
    if (config.pad_enabled) {
      lastTicketNumber = lastTicketNumber.padStart(actualPadWidth, config.pad_char);
    }
    
    if (config.prefix) {
      lastTicketNumber = config.prefix + config.separator + lastTicketNumber;
    }
    
    if (config.suffix) {
      lastTicketNumber = lastTicketNumber + config.separator + config.suffix;
    }
    
    numbers.push('...');
    numbers.push(lastTicketNumber);
  }
  
  return numbers;
}

export function NumberingConfigPanel({ form, totalTickets }: NumberingConfigPanelProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('simple');
  const prevTotalTicketsRef = useRef<number>(totalTickets);
  const hasInitializedRef = useRef<boolean>(false);
  
  // Get current config from form - default to simple (consecutivo)
  const currentConfig: NumberingConfig = form.watch('numbering_config') || NUMBERING_PRESETS[0].config;
  
  // Get recommendation based on total tickets
  const recommendedPreset = useMemo(() => getRecommendedPreset(totalTickets), [totalTickets]);
  
  // Generate preview numbers
  const previewNumbers = useMemo(() => {
    return generatePreviewNumbers(currentConfig, totalTickets);
  }, [currentConfig, totalTickets]);
  
  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = NUMBERING_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      form.setValue('numbering_config', preset.config);
      
      // Also set legacy field for backwards compatibility
      if (preset.config.mode === 'random_permutation') {
        form.setValue('ticket_number_format', 'random');
      } else if (preset.config.prefix) {
        form.setValue('ticket_number_format', 'prefixed');
      } else {
        form.setValue('ticket_number_format', 'sequential');
      }
    }
  };
  
  // Update single config field
  const updateConfig = (field: keyof NumberingConfig, value: any) => {
    const newConfig = { ...currentConfig, [field]: value };
    form.setValue('numbering_config', newConfig);
    setSelectedPreset('custom'); // Mark as custom when manually changed
  };
  
  // Detect current preset on mount
  useEffect(() => {
    const existingConfig = form.getValues('numbering_config');
    if (existingConfig) {
      const matching = NUMBERING_PRESETS.find(p => 
        p.config.mode === existingConfig.mode &&
        p.config.pad_enabled === existingConfig.pad_enabled &&
        p.config.pad_width === existingConfig.pad_width &&
        p.config.prefix === existingConfig.prefix
      );
      if (matching) {
        setSelectedPreset(matching.id);
      } else {
        setSelectedPreset('custom');
      }
    } else {
      // Set default config to simple (consecutivo) for new raffles
      form.setValue('numbering_config', NUMBERING_PRESETS[0].config);
      form.setValue('ticket_number_format', 'sequential');
    }
    hasInitializedRef.current = true;
  }, []);

  // Show toast when totalTickets changes and recommendation changes
  useEffect(() => {
    // Skip on initial mount
    if (!hasInitializedRef.current) return;
    
    const prevTotal = prevTotalTicketsRef.current;
    const prevRecommended = getRecommendedPreset(prevTotal);
    
    // Only show toast if:
    // 1. The quantity actually changed
    // 2. The recommendation changed
    // 3. The current selection is NOT the new recommendation
    if (
      prevTotal !== totalTickets && 
      prevRecommended.id !== recommendedPreset.id && 
      selectedPreset !== recommendedPreset.id
    ) {
      const recommendedPresetData = NUMBERING_PRESETS.find(p => p.id === recommendedPreset.id);
      
      toast.info('¿Cambiar formato de numeración?', {
        description: `Para ${totalTickets.toLocaleString()} boletos te sugerimos "${recommendedPresetData?.name}". ${recommendedPreset.reason}`,
        duration: 8000,
        action: {
          label: 'Aplicar',
          onClick: () => applyPreset(recommendedPreset.id),
        },
        cancel: {
          label: 'Mantener',
          onClick: () => {},
        },
      });
    }
    
    prevTotalTicketsRef.current = totalTickets;
  }, [totalTickets, recommendedPreset.id, selectedPreset]);
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Configuración de Numeración
        </CardTitle>
        <CardDescription>
          Personaliza cómo se mostrarán los números de tus boletos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NUMBERING_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;
            const isRecommended = recommendedPreset.id === preset.id;
            
            return (
              <motion.div
                key={preset.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-auto w-full py-3 px-3 flex flex-col items-start text-left gap-2 relative overflow-hidden transition-all duration-200",
                    isSelected && "ring-2 ring-primary ring-offset-2 shadow-lg",
                    isRecommended && !isSelected && "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10",
                    !isSelected && "hover:border-primary/50 hover:shadow-md"
                  )}
                  onClick={() => applyPreset(preset.id)}
                >
                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex items-center gap-3 w-full min-w-0">
                    {/* Icon with background */}
                    <motion.div
                      animate={{ 
                        rotate: isSelected ? [0, -10, 10, 0] : 0,
                      }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isSelected 
                          ? "bg-primary-foreground/20" 
                          : "bg-muted"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 transition-colors",
                        isSelected ? "text-primary-foreground" : preset.iconColor
                      )} />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{preset.name}</span>
                        {isRecommended && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1 }}
                          >
                            <Badge 
                              variant={isSelected ? "secondary" : "outline"} 
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-5 shrink-0",
                                !isSelected && "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                              )}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span className="hidden xs:inline ml-0.5">Sugerido</span>
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      <span className={cn(
                        "text-xs block mt-0.5",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {preset.description}
                      </span>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
        
        {/* Recommendation Tip */}
        <AnimatePresence>
          {selectedPreset !== recommendedPreset.id && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-sm">
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                  className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </motion.div>
                <div className="text-amber-700 dark:text-amber-300 flex-1">
                  <span className="font-medium">Sugerencia:</span>{' '}
                  Para {totalTickets.toLocaleString()} boletos, {recommendedPreset.reason.toLowerCase()}.
                  <Button 
                    variant="link" 
                    size="sm" 
                    type="button"
                    className="text-amber-600 dark:text-amber-400 h-auto p-0 ml-1 font-semibold hover:text-amber-500"
                    onClick={() => applyPreset(recommendedPreset.id)}
                  >
                    Usar formato sugerido →
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Preview Section */}
        <motion.div 
          className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border"
          layout
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">Vista Previa</span>
            <AnimatePresence mode="wait">
              {currentConfig.mode === 'random_permutation' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Badge variant="secondary" className="text-xs">
                    <Shuffle className="w-3 h-3 mr-1" />
                    Orden aleatorio
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {previewNumbers.map((num, i) => (
                <motion.div
                  key={`${selectedPreset}-${num}-${i}`}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: i * 0.03,
                    type: "spring",
                    stiffness: 500,
                    damping: 25
                  }}
                >
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-mono text-sm transition-colors",
                      num === '...' 
                        ? "bg-transparent border-dashed text-muted-foreground" 
                        : "bg-background hover:bg-primary/5 hover:border-primary/50"
                    )}
                  >
                    {num}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Advanced Settings Collapsible */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between" type="button">
              <span className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configuración Avanzada
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                isAdvancedOpen && "transform rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Start Number and Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Número Inicial</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={currentConfig.start_number}
                    onChange={(e) => updateConfig('start_number', parseInt(e.target.value) || 1)}
                    min={0}
                  />
                </FormControl>
                <FormDescription>Primer número del rango</FormDescription>
              </FormItem>
              
              <FormItem>
                <FormLabel>Número Final (Rango)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={currentConfig.range_end || currentConfig.start_number + totalTickets - 1}
                    onChange={(e) => updateConfig('range_end', parseInt(e.target.value) || null)}
                    min={currentConfig.start_number}
                    placeholder="Auto"
                  />
                </FormControl>
                <FormDescription>Opcional: define el último número</FormDescription>
              </FormItem>
            </div>
            
            {/* Padding Settings */}
            <div className="grid grid-cols-3 gap-4">
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 col-span-3">
                <div className="space-y-0.5">
                  <FormLabel>Usar ceros a la izquierda</FormLabel>
                  <FormDescription>001 en lugar de 1</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={currentConfig.pad_enabled}
                    onCheckedChange={(checked) => updateConfig('pad_enabled', checked)}
                  />
                </FormControl>
              </FormItem>
              
              {currentConfig.pad_enabled && (
                <>
                  <FormItem>
                    <FormLabel>Ancho de Dígitos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={currentConfig.pad_width ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateConfig('pad_width', val ? parseInt(val) : null);
                        }}
                        min={1}
                        max={10}
                        placeholder="Auto"
                      />
                    </FormControl>
                    <FormDescription>
                      {currentConfig.pad_width 
                        ? `Fijo: ${currentConfig.pad_width} dígitos` 
                        : `Auto: ${Math.max(3, totalTickets.toString().length)} dígitos`}
                    </FormDescription>
                  </FormItem>
                  
                  <FormItem>
                    <FormLabel>Carácter de Relleno</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={currentConfig.pad_char}
                        onChange={(e) => updateConfig('pad_char', e.target.value.slice(0, 1) || '0')}
                        maxLength={1}
                        className="text-center font-mono"
                      />
                    </FormControl>
                    <FormDescription>Normalmente "0"</FormDescription>
                  </FormItem>
                </>
              )}
            </div>
            
            {/* Prefix/Suffix Settings */}
            <div className="grid grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>Prefijo</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={currentConfig.prefix || ''}
                    onChange={(e) => updateConfig('prefix', e.target.value || null)}
                    placeholder="Ej: TKT"
                    className="font-mono"
                  />
                </FormControl>
              </FormItem>
              
              <FormItem>
                <FormLabel>Separador</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={currentConfig.separator}
                    onChange={(e) => updateConfig('separator', e.target.value)}
                    placeholder="-"
                    maxLength={3}
                    className="text-center font-mono"
                  />
                </FormControl>
              </FormItem>
              
              <FormItem>
                <FormLabel>Sufijo</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    value={currentConfig.suffix || ''}
                    onChange={(e) => updateConfig('suffix', e.target.value || null)}
                    placeholder="Ej: MX"
                    className="font-mono"
                  />
                </FormControl>
              </FormItem>
            </div>
            
            {/* Step (for advanced users) */}
            <FormItem>
              <FormLabel>Incremento (Step)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={currentConfig.step}
                  onChange={(e) => updateConfig('step', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24"
                />
              </FormControl>
              <FormDescription>
                Normalmente 1. Usa otro valor para saltar números (ej: step=10 genera 1, 11, 21...)
              </FormDescription>
            </FormItem>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
