import { useMemo, CSSProperties, ReactElement } from 'react';
import { Grid } from 'react-window';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface TicketData {
  id: string;
  ticket_number: string;
  status: string;
}

interface VirtualizedTicketGridProps {
  tickets: TicketData[];
  selectedTickets: string[];
  onTicketClick: (ticketNumber: string, status: string) => void;
  columnCount: number;
  height: number;
  width: number;
}

const CELL_SIZE = 52;

interface CellData {
  tickets: TicketData[];
  selectedTickets: string[];
  onTicketClick: (ticketNumber: string, status: string) => void;
  columnCount: number;
}

interface CellComponentProps {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  ariaAttributes: {
    "aria-colindex": number;
    role: "gridcell";
  };
}

function CellComponent(props: CellComponentProps & CellData): ReactElement {
  const { columnIndex, rowIndex, style, tickets, selectedTickets, onTicketClick, columnCount } = props;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= tickets.length) {
    return <div style={style} />;
  }
  
  const ticket = tickets[index];
  const isAvailable = ticket.status === 'available';
  const isSelected = selectedTickets.includes(ticket.ticket_number);
  
  return (
    <div style={{ ...style, padding: 4 }}>
      <button
        onClick={() => onTicketClick(ticket.ticket_number, ticket.status)}
        disabled={!isAvailable}
        className={cn(
          "relative w-full h-full rounded-lg text-xs font-mono font-bold transition-all border-2 flex items-center justify-center",
          isAvailable && !isSelected && "bg-green-50 border-green-300 text-green-700 hover:bg-green-100 cursor-pointer hover:scale-105",
          isAvailable && isSelected && "bg-green-500 border-green-600 text-white ring-2 ring-green-400 ring-offset-1",
          !isAvailable && "bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-60"
        )}
      >
        {ticket.ticket_number}
        {isSelected && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-green-600" />
          </span>
        )}
      </button>
    </div>
  );
}

export function VirtualizedTicketGrid({
  tickets,
  selectedTickets,
  onTicketClick,
  columnCount,
  height,
  width,
}: VirtualizedTicketGridProps) {
  const rowCount = Math.ceil(tickets.length / columnCount);
  
  const cellProps = useMemo(() => ({
    tickets,
    selectedTickets,
    onTicketClick,
    columnCount,
  }), [tickets, selectedTickets, onTicketClick, columnCount]);
  
  return (
    <Grid<CellData>
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mx-auto"
      columnCount={columnCount}
      columnWidth={CELL_SIZE}
      rowCount={rowCount}
      rowHeight={CELL_SIZE}
      style={{ height, width: Math.min(width, columnCount * CELL_SIZE) }}
      cellComponent={CellComponent}
      cellProps={cellProps}
    />
  );
}
