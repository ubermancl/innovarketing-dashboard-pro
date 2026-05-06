import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, ChevronUp, ChevronDown, Download, ChevronLeft, ChevronRight, Eye, Users, X } from 'lucide-react';
import { Card, Button, Select, CRMBadge, Modal } from './ui';
import { formatDate, formatPhone, formatName, formatCurrency, formatDateTime } from '../utils/formatters';

// Modal de detalles del lead
function LeadDetailModal({ lead, isOpen, onClose }) {
  if (!lead) return null;

  const sections = [
    {
      title: 'Información Personal',
      fields: [
        { label: 'Nombre', value: formatName(lead.Nombre) },
        { label: 'Teléfono', value: formatPhone(lead.Phone) },
        { label: 'Email', value: lead.Email },
      ],
    },
    {
      title: 'Estado',
      fields: [
        { label: 'Estado CRM', value: lead['Estado CRM'], badge: true },
        { label: 'Estado Agendamiento', value: lead['Estado Agendamiento'] },
        { label: '¿Calificado?', value: lead['¿Calificado?'] ? 'Sí' : 'No' },
      ],
    },
    {
      title: 'Ubicación',
      fields: [
        { label: 'Distrito Residencia', value: lead['Distrito Residencia'] },
        { label: 'Distrito Trabajo', value: lead['Distrito Trabajo'] },
      ],
    },
    {
      title: 'Citas',
      fields: [
        { label: 'Fecha Agendamiento', value: formatDate(lead['Fecha de agendamiento']) },
        { label: 'Hora Cita', value: lead['Hora Cita'] },
        { label: 'Confirmó Cita', value: lead['Confirmo Cita'] ? 'Sí' : 'No' },
      ],
    },
    {
      title: 'Ventas',
      fields: [
        { label: 'Monto Venta', value: formatCurrency(lead['Monto Venta Cerrada (PEN)']) },
        { label: 'Plan Adquirido', value: lead['Plan Adquirido'] },
      ],
    },
    {
      title: 'Fechas',
      fields: [
        { label: 'Creado', value: formatDateTime(lead['CreatedAt']) },
        { label: 'Última Modificación', value: formatDateTime(lead['Última Modificación']) },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles del Lead" size="lg">
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-semibold text-accent-cyan mb-3">{section.title}</h4>
            <div className="grid grid-cols-2 gap-3">
              {section.fields.map((field) => (
                <div key={field.label} className="text-sm">
                  <span className="text-gray-500">{field.label}: </span>
                  {field.badge && field.value ? (
                    <CRMBadge state={field.value} size="sm" />
                  ) : (
                    <span className="text-gray-200 font-medium">{field.value || '-'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function Table({
  leads,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  districtFilter,
  onDistrictChange,
  uniqueStatuses,
  uniqueDistricts,
}) {
  const [sorting, setSorting] = useState([{ id: 'CreatedAt', desc: true }]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Columnas
  const columns = useMemo(() => [
    {
      accessorKey: 'Nombre',
      header: 'Nombre',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-100">{formatName(getValue())}</span>
      ),
    },
    {
      accessorKey: 'Phone',
      header: 'Teléfono',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-300">{formatPhone(getValue())}</span>
      ),
    },
    {
      accessorKey: 'Estado CRM',
      header: 'Estado',
      cell: ({ getValue }) => <CRMBadge state={getValue()} size="sm" />,
    },
    {
      accessorKey: 'Distrito Usado Para Calificar',
      header: 'Distrito',
      cell: ({ getValue, row }) => (
        <span className="text-gray-400">{getValue() || row.original['Distrito Residencia'] || '-'}</span>
      ),
    },
    {
      accessorKey: 'CreatedAt',
      header: 'Fecha',
      cell: ({ getValue }) => (
        <span className="text-gray-400">{formatDate(getValue())}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLead(row.original);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ], []);

  // Configuración de la tabla
  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Nombre', 'Teléfono', 'Email', 'Estado CRM', 'Distrito', 'Fecha Creación', 'Monto Venta'];
    const rows = leads.map(lead => [
      lead.Nombre || '',
      lead.Phone || '',
      lead.Email || '',
      lead['Estado CRM'] || '',
      lead['Distrito Usado Para Calificar'] || lead['Distrito Residencia'] || '',
      lead.CreatedAt || '',
      lead['Monto Venta Cerrada (PEN)'] || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card padding="none">
        {/* Header colapsable */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-dark-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-cyan/10">
              <Users className="w-5 h-5 text-accent-cyan" />
            </div>
            <span className="font-semibold text-gray-100">
              Leads
            </span>
            <span className="px-2 py-0.5 bg-dark-600 text-gray-300 text-xs rounded-full">
              {leads.length}
            </span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {!isCollapsed && (
          <>
            {/* Filtros */}
            <div className="p-4 border-t border-dark-600 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-input text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => onStatusChange(e.target.value)}
                  options={[
                    { value: '', label: 'Todos los estados' },
                    ...uniqueStatuses.map(s => ({ value: s, label: s }))
                  ]}
                  className="w-full sm:w-44"
                />
                <Select
                  value={districtFilter}
                  onChange={(e) => onDistrictChange(e.target.value)}
                  options={[
                    { value: '', label: 'Todos los distritos' },
                    ...uniqueDistricts.map(d => ({ value: d, label: d }))
                  ]}
                  className="w-full sm:w-44"
                />
                <Button variant="secondary" size="md" onClick={exportToCSV}>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto border-t border-dark-600">
              <table className="w-full">
                <thead className="bg-dark-700/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-dark-600/50 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-3 h-3" />}
                            {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-3 h-3" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-dark-700/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedLead(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="p-4 border-t border-dark-600 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Mostrar:</span>
                <Select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                  options={[
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                  ]}
                  className="w-20"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal de detalles */}
      <LeadDetailModal
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </>
  );
}
