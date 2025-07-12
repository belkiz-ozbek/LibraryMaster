import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ServerDataTableProps<T> {
  data: PaginatedResponse<T>;
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
  loading = false,
  emptyMessage = "No data available"
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { t } = useTranslation();

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const getValue = (row: T, key: string) => {
    if (key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], row);
    }
    return row[key];
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`h-12 min-w-[120px] ${column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}`}
                  onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                >
                  <div className="flex items-center space-x-1 font-medium">
                    <span className="text-sm sm:text-base">{column.title}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-text-muted">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className="py-3 min-w-[120px]">
                      {column.render 
                        ? column.render(getValue(row, String(column.key)), row, index)
                        : getValue(row, String(column.key))
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted text-center sm:text-left">
            {t("pagination.showing", {
              start: startIndex + 1,
              end: Math.min(startIndex + pageSize, data.length),
              total: data.length
            })}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="hidden sm:flex"
            >
              <ChevronLeft size={16} />
              {t("pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="sm:hidden"
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-text-muted">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  </div>
                ))
              }
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="hidden sm:flex"
            >
              {t("pagination.next")}
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="sm:hidden"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ServerDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  onPageChange
}: ServerDataTableProps<T>) {
  // Güvenli kontrol: data veya data.pagination yoksa boş tablo göster
  if (!data || !data.pagination) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className="h-12"
                  >
                    <div className="flex items-center space-x-1 font-medium">
                      <span>{column.title}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-text-muted">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const { data: tableData, pagination } = data;
  const { t } = useTranslation();

  const getValue = (row: T, key: string) => {
    if (key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], row);
    }
    return row[key];
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: pagination.limit }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className="h-12 min-w-[120px]"
                >
                  <div className="flex items-center space-x-1 font-medium">
                    <span className="text-sm sm:text-base">{column.title}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!tableData || tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-text-muted">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/50 data-[state=selected]:bg-muted">
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className="py-3 min-w-[120px]">
                      {column.render 
                        ? column.render(getValue(row, String(column.key)), row, index)
                        : getValue(row, String(column.key))
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Server-side Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted text-center sm:text-left">
            {t("pagination.showing", {
              start: ((pagination.page - 1) * pagination.limit) + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="hidden sm:flex"
            >
              <ChevronLeft size={16} />
              {t("pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="sm:hidden"
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === pagination.totalPages || 
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-text-muted">...</span>
                    )}
                    <Button
                      variant={pagination.page === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange?.(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  </div>
                ))
              }
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="hidden sm:flex"
            >
              {t("pagination.next")}
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="sm:hidden"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
