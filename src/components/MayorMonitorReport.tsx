import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, Download, Clock } from 'lucide-react';

const OurCityReport = () => {
  const [pdfUrl, setPdfUrl] = useState('/files/mayor-monitor.pdf');
  const [excelUrl, setExcelUrl] = useState('/files/mayor-monitor.xlsx');
  const [lastUpdate] = useState('01.01.2024 12:00');

  return (
    <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 text-gray-600 hover:text-purple-800 rounded-full hover:bg-purple-50"
              >
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Обращения на мониторе мэра</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={20} />
                <span>Обновлено: {lastUpdate}</span>
              </div>
              <a href={excelUrl} download className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                <FileSpreadsheet size={20} />
                Скачать Excel
              </a>
            </div>
          </div>

      <div className="bg-white rounded-lg shadow-sm p-4 min-h-[600px]">
        <object data={pdfUrl} type="application/pdf" className="w-full h-[600px]">
          <p>
            PDF не может быть отображен.{' '}
            <a href={pdfUrl} download className="text-purple-600 hover:text-purple-800">
              Скачать PDF
            </a>
          </p>
        </object>
      </div>
    </div>
  );
};

export default OurCityReport;
