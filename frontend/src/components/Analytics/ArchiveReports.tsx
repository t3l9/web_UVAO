import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Download, FileText, FileSpreadsheet, Search, X,
  Archive, MessageSquare, Monitor, Building2, BarChart3, Camera, AlertTriangle,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PDFViewer from '../PDFViewer';

interface ArchiveFile {
  name: string;
  type: 'pdf' | 'xlsx';
  datetime: string;
}

interface Report {
  date: string;
  files: ArchiveFile[];
}

interface ArchiveReportsProps {
  user: { duty: string };
}

const reportTypes = [
  { id: 'our-city',        title: 'Наш Город',       folder: 'NG',     icon: MessageSquare, color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-100 dark:bg-violet-900/40'  },
  { id: 'mayor-monitor',   title: 'Монитор Мэра',    folder: 'MM',     icon: Monitor,       color: 'text-blue-600   dark:text-blue-400',    bg: 'bg-blue-100   dark:bg-blue-900/40'    },
  { id: 'prefect',         title: 'Префект',          folder: 'Pref',   icon: Building2,     color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-100 dark:bg-indigo-900/40'  },
  { id: 'mzhi',            title: 'МЖИ',              folder: 'MWI',    icon: FileText,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { id: 'mzhi-statistics', title: 'Статистика МЖИ',  folder: 'MWIS',   icon: BarChart3,     color: 'text-teal-600   dark:text-teal-400',    bg: 'bg-teal-100   dark:bg-teal-900/40'    },
  { id: 'tsafap',          title: 'ЦАФАП',            folder: 'TSAFAP', icon: Camera,        color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-100 dark:bg-orange-900/40'  },
  { id: 'oati',            title: 'ОАТИ',             folder: 'OATI',   icon: AlertTriangle, color: 'text-red-600    dark:text-red-400',      bg: 'bg-red-100    dark:bg-red-900/40'     },
];

// Pagination: smart page numbers with ellipsis
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function ArchiveReports({ user }: ArchiveReportsProps) {
  const [selectedType, setSelectedType]   = useState('');
  const [reports, setReports]             = useState<Report[]>([]);
  const [filtered, setFiltered]           = useState<Report[]>([]);
  const [currentPage, setCurrentPage]     = useState(1);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [startDate, setStartDate]         = useState<Date | null>(null);
  const [endDate, setEndDate]             = useState<Date | null>(null);
  const [viewingPdf, setViewingPdf]       = useState<{ url: string; title: string } | null>(null);

  const PER_PAGE = 10;

  // Load archive when type changes
  useEffect(() => {
    if (!selectedType) return;
    const folder = reportTypes.find(t => t.id === selectedType)?.folder;
    if (!folder) return;
    setLoading(true);
    setError('');
    setCollapsedDates(new Set());
    fetch(`/api/archive?folder=${folder}`)
      .then(r => { if (!r.ok) throw new Error(`Ошибка сервера: ${r.status}`); return r.json(); })
      .then(data => { setReports(data || []); setFiltered(data || []); })
      .catch(e => { setError(`Ошибка загрузки: ${e.message}`); setReports([]); setFiltered([]); })
      .finally(() => setLoading(false));
  }, [selectedType]);

  // Filter
  useEffect(() => {
    if (!startDate && !endDate && !searchQuery) { setFiltered(reports); return; }
    const result = reports.filter(r => {
      const parts = r.date.split('.');
      if (parts.length !== 3) return false;
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      const afterStart = !startDate || d >= startDate;
      const beforeEnd  = !endDate   || d <= endDate;
      const matchSearch = !searchQuery ||
        r.date.includes(searchQuery) ||
        r.files.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return afterStart && beforeEnd && matchSearch;
    });
    setFiltered(result);
    setCurrentPage(1);
  }, [startDate, endDate, searchQuery, reports]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleDate = (date: string) => {
    setCollapsedDates(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  const clearFilters = () => { setStartDate(null); setEndDate(null); setSearchQuery(''); };

  const viewPdf = (file: ArchiveFile, date: string) => {
    const folder = reportTypes.find(t => t.id === selectedType)?.folder;
    const typeTitle = reportTypes.find(t => t.id === selectedType)?.title;
    if (folder && file.type === 'pdf') {
      setViewingPdf({
        url: `/api/archive/download?folder=${folder}&file=${encodeURIComponent(file.name)}`,
        title: `${typeTitle} — ${date}`,
      });
    }
  };

  const getDownloadUrl = (file: ArchiveFile) => {
    const folder = reportTypes.find(t => t.id === selectedType)?.folder;
    return `/api/archive/download?folder=${folder}&file=${encodeURIComponent(file.name)}`;
  };

  if (user.duty !== 'Префектура') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-5 text-center animate-fade-in">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Доступ ограничен</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Этот раздел доступен только для Префектуры</p>
        </div>
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors">
          <ArrowLeft size={15} />На главную
        </Link>
      </div>
    );
  }

  const totalPages   = Math.ceil(filtered.length / PER_PAGE);
  const pageReports  = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const hasFilters   = !!(startDate || endDate || searchQuery);
  const totalFiles   = filtered.reduce((s, r) => s + r.files.length, 0);
  const pdfCount     = filtered.reduce((s, r) => s + r.files.filter(f => f.type === 'pdf').length, 0);
  const excelCount   = filtered.reduce((s, r) => s + r.files.filter(f => f.type === 'xlsx').length, 0);
  const selectedMeta = reportTypes.find(t => t.id === selectedType);

  return (
    <>
      {/* ── PDF Modal ──────────────────────────────────────────── */}
      {viewingPdf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">{viewingPdf.title}</p>
              <button
                onClick={() => setViewingPdf(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer url={viewingPdf.url} title={viewingPdf.title} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5 animate-fade-in">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Archive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Архив отчётов</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">История всех типов отчётов</p>
          </div>
        </div>

        {/* ── Report type pills ──────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {reportTypes.map(t => {
            const active = selectedType === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setSelectedType(t.id); setCurrentPage(1); clearFilters(); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0
                  ${active
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
              >
                <Icon size={14} />
                {t.title}
              </button>
            );
          })}
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        {selectedType && (
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по дате или имени файла…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary-400 dark:focus:border-primary-600 transition-colors"
              />
            </div>
            {/* Date from */}
            <DatePicker
              selected={startDate}
              onChange={(d: Date | null) => setStartDate(d)}
              dateFormat="dd.MM.yyyy"
              placeholderText="Дата с"
              isClearable
              className="w-full sm:w-36 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-400 dark:focus:border-primary-600 transition-colors"
            />
            {/* Date to */}
            <DatePicker
              selected={endDate}
              onChange={(d: Date | null) => setEndDate(d)}
              dateFormat="dd.MM.yyyy"
              placeholderText="Дата по"
              isClearable
              minDate={startDate ?? undefined}
              className="w-full sm:w-36 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary-400 dark:focus:border-primary-600 transition-colors"
            />
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 text-sm transition-all duration-150 whitespace-nowrap"
              >
                <X size={14} />Сбросить
              </button>
            )}
          </div>
        )}

        {/* ── Stats chips ────────────────────────────────────────── */}
        {selectedType && !loading && !error && filtered.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400">
              <Calendar size={13} />
              {filtered.length} {filtered.length === 1 ? 'отчёт' : filtered.length < 5 ? 'отчёта' : 'отчётов'}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
              <FileText size={13} />
              {pdfCount} PDF
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet size={13} />
              {excelCount} Excel
            </div>
            {hasFilters && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                из {reports.length} всего
              </span>
            )}
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
              <div className="absolute inset-0 rounded-full border-[3px] border-primary-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Загрузка архива…</p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900/50">
            <div className="w-7 h-7 bg-red-100 dark:bg-red-900/60 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed pt-1">{error}</p>
          </div>
        )}

        {/* ── Empty: no type selected ─────────────────────────────── */}
        {!selectedType && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              <Archive className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Выберите тип отчёта</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Нажмите на одну из кнопок выше</p>
            </div>
          </div>
        )}

        {/* ── Empty: no results ───────────────────────────────────── */}
        {selectedType && !loading && !error && filtered.length === 0 && reports.length > 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              <Search className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ничего не найдено</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Попробуйте изменить фильтры</p>
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        )}

        {/* ── Empty: no reports at all ────────────────────────────── */}
        {selectedType && !loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Архив пуст или данные не найдены</p>
          </div>
        )}

        {/* ── Report list ─────────────────────────────────────────── */}
        {!loading && !error && pageReports.length > 0 && (
          <div className="space-y-3">
            {pageReports.map(report => {
              const collapsed = collapsedDates.has(report.date);
              return (
                <div
                  key={report.date}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                  {/* Date header */}
                  <button
                    onClick={() => toggleDate(report.date)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{report.date}</span>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400">
                        {report.files.length} {report.files.length === 1 ? 'файл' : report.files.length < 5 ? 'файла' : 'файлов'}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${collapsed ? '' : 'rotate-180'}`}
                    />
                  </button>

                  {/* Files */}
                  {!collapsed && (
                    <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/80">
                      {report.files.map((file, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                          {/* Icon + info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              file.type === 'pdf'
                                ? 'bg-red-100 dark:bg-red-900/30'
                                : 'bg-emerald-100 dark:bg-emerald-900/30'
                            }`}>
                              {file.type === 'pdf'
                                ? <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                                : <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{file.datetime}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-12 sm:ml-0 flex-shrink-0">
                            {file.type === 'pdf' && (
                              <button
                                onClick={() => viewPdf(file, report.date)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all duration-150"
                              >
                                <Eye size={13} />
                                Открыть
                              </button>
                            )}
                            <a
                              href={getDownloadUrl(file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 ${
                                file.type === 'pdf'
                                  ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Download size={13} />
                              {file.type === 'pdf' ? 'PDF' : 'Excel'}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Pagination ──────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                  <ChevronLeft size={16} />
                </button>

                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === '...'
                    ? <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">…</span>
                    : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all active:scale-90 ${
                          currentPage === page
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    )
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default ArchiveReports;
