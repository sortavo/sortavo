import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

export async function exportFinancialReportPDF(raffleId: string, raffleName: string) {
  // 1. Query data
  const { data: raffle } = await supabase
    .from('raffles')
    .select('*')
    .eq('id', raffleId)
    .single();
  
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('raffle_id', raffleId)
    .eq('status', 'sold');
  
  if (!raffle || !tickets) throw new Error('Data not found');
  
  // 2. Calculate metrics
  const ticketPrice = raffle.ticket_price || 0;
  const totalRevenue = tickets.length * ticketPrice;
  const totalTickets = raffle.total_tickets;
  const soldTickets = tickets.length;
  const availableTickets = totalTickets - soldTickets;
  const conversionRate = (soldTickets / totalTickets) * 100;
  
  // Payment method breakdown
  const paymentMethods = tickets.reduce((acc, t) => {
    const method = t.payment_method || 'No especificado';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // City breakdown
  const cities = tickets.reduce((acc, t) => {
    const city = t.buyer_city || 'No especificado';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // 3. Create PDF
  const doc = new jsPDF();
  
  // 4. Header
  doc.setFontSize(20);
  doc.text('Reporte Financiero', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(raffleName, 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 105, 38, { align: 'center' });
  
  // 5. Summary Section
  doc.setFontSize(14);
  doc.text('Resumen Ejecutivo', 20, 55);
  
  const summaryData = [
    ['Ingresos Totales', `$${totalRevenue.toLocaleString('es-MX')}`],
    ['Boletos Vendidos', `${soldTickets} / ${totalTickets}`],
    ['Boletos Disponibles', availableTickets.toString()],
    ['Tasa de Conversión', `${conversionRate.toFixed(1)}%`],
    ['Precio por Boleto', `$${ticketPrice.toLocaleString('es-MX')}`],
    ['Valor del Premio', `$${(raffle.prize_value || 0).toLocaleString('es-MX')}`],
  ];
  
  autoTable(doc, {
    startY: 60,
    head: [['Métrica', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  // 6. Payment Methods Section
  // @ts-ignore - jspdf-autotable adds this property
  let finalY = doc.lastAutoTable?.finalY || 60;
  
  doc.setFontSize(14);
  doc.text('Métodos de Pago', 20, finalY + 15);
  
  const paymentData = Object.entries(paymentMethods).map(([method, count]) => [
    method,
    count.toString(),
    `${((count / soldTickets) * 100).toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Método de Pago', 'Cantidad', 'Porcentaje']],
    body: paymentData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  // 7. Geographic Distribution
  // @ts-ignore
  finalY = doc.lastAutoTable?.finalY || finalY + 20;
  
  doc.setFontSize(14);
  doc.text('Distribución Geográfica', 20, finalY + 15);
  
  const cityData = Object.entries(cities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([city, count]) => [
      city,
      count.toString(),
      `${((count / soldTickets) * 100).toFixed(1)}%`
    ]);
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Ciudad', 'Boletos', 'Porcentaje']],
    body: cityData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] }
  });
  
  // 8. Top Buyers
  const buyerTickets = tickets.reduce((acc, t) => {
    const email = t.buyer_email || 'unknown';
    if (!acc[email]) {
      acc[email] = { name: t.buyer_name || 'Sin nombre', count: 0, total: 0 };
    }
    acc[email].count += 1;
    acc[email].total += ticketPrice;
    return acc;
  }, {} as Record<string, { name: string; count: number; total: number }>);
  
  const topBuyers = Object.entries(buyerTickets)
    .map(([email, data]) => ({ email, ...data }))
    .filter(b => b.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  if (topBuyers.length > 0) {
    // @ts-ignore
    const buyersY = doc.lastAutoTable?.finalY || finalY + 20;
    
    // Check if we need a new page
    if (buyersY > 230) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Top 10 Compradores', 20, 20);
      
      autoTable(doc, {
        startY: 25,
        head: [['Nombre', 'Email', 'Boletos', 'Total']],
        body: topBuyers.map(b => [
          b.name,
          b.email,
          b.count.toString(),
          `$${b.total.toLocaleString('es-MX')}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });
    } else {
      doc.setFontSize(14);
      doc.text('Top 10 Compradores', 20, buyersY + 15);
      
      autoTable(doc, {
        startY: buyersY + 20,
        head: [['Nombre', 'Email', 'Boletos', 'Total']],
        body: topBuyers.map(b => [
          b.name,
          b.email,
          b.count.toString(),
          `$${b.total.toLocaleString('es-MX')}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });
    }
  }
  
  // 9. Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // 10. Save
  const fileName = `reporte-financiero-${raffleName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
  doc.save(fileName);
  
  return { success: true };
}
