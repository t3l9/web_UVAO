import React from 'react';
import { FileText, Video, Download } from 'lucide-react';

const resources = [
  {
    title: 'Руководство по созданию отчета "Ответы в работе"',
    description: 'Подробная инструкция по созданию отчета "Ответы в работе" для мониторинга сообщений на портале "Наш город"',
    type: 'pdf',
    filename: 'otvetyvrabote.pdf',
    excelFilename: 'our-city-shablon.xlsx',
  },
  {
    title: 'Видеоинструкция: Выход техники',
    description: 'Обучающее видео по формированию отчета о работе техники на ДТ и ОДХ с использованием фиксаграммы',
    type: 'video',
    filename: 'vihod.mp4',
    excelFilename: 'shablon_vihoda_tehniki.xlsx',
  },
  {
    title: 'Видеоинструкция: Снятие просрока с заявки',
    description: 'Обучающее видео по снятию просрока с заявки на АРМ Префектур. Если заявка просрочена по необъективным причинам, вы можете предоставить аргументы и снять просрочку.',
    type: 'video',
    filename: 'delete_monitor.mp4',
  },
];

function Knowledge() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">База знаний</h1>
        <p className="text-gray-600">
          Обучающие материалы и документация для эффективной работы с информационной системой.
          Здесь вы найдете руководства, инструкции и обучающие видео.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((resource, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 flex items-start gap-4"
          >
            {resource.type === 'pdf' ? (
              <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
            ) : (
              <Video className="w-8 h-8 text-blue-500 flex-shrink-0" />
            )}
            <div className="flex-grow">
              <h3 className="font-medium text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
              <div className="flex items-center gap-4">
                <a
                  href={`/baza/${resource.filename}`}
                  download
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
                >
                  <Download size={16} />
                  Скачать {resource.type === 'pdf' ? 'PDF' : 'видео'}
                </a>
                {resource.excelFilename && (  // Проверка на наличие excelFilename
                  <a
                    href={`/baza/${resource.excelFilename}`}
                    download
                    className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
                  >
                    <Download size={16} />
                    Скачать шаблон Excel
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-purple-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">
          Нужна помощь?
        </h2>
        <p className="text-purple-800 mb-4">
          Если у вас возникли вопросы по работе с системой или вам нужна дополнительная информация,
          обратитесь в службу поддержки:
        </p>
        <ul className="list-disc list-inside text-purple-800">
          <li>Email: support@uvao.ru</li>
          <li>Телефон: +7 (495) 123-45-67</li>
          <li>Время работы: Пн-Пт, 9:00 - 17:00</li>
        </ul>
      </div>
    </div>
  );
}

export default Knowledge;