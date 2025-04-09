import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, BookOpen, BrainCircuit, HelpCircle } from 'lucide-react';

const reportTypes = [
  {
    id: 'our-city',
    title: 'Обращения на портале "Наш город"',
    description: 'Мониторинг и анализ обращений граждан через портал "Наш город"',
  },
  {
    id: 'mayor-monitor',
    title: 'Обращения на мониторе мэра',
    description: 'Отслеживание и обработка обращений через систему мониторинга мэра',
  },
  {
    id: 'prefect',
    title: 'Сообщения личного кабинета Префекта',
    description: 'Контроль обращений личного кабинета Префекта',
  },
  {
    id: 'mzhi',
    title: 'Сообщения МЖИ',
    description: 'Контроль обращений в работе от Мосжилинспекции ',
  },
];

const additionalSections = [
  {
    id: 'scripts',
    title: 'Скрипты',
    description: 'Готовые ответы на обращения граждан с удобной системой фильтрации',
    icon: BrainCircuit,
  },
  {
    id: 'knowledge',
    title: 'База знаний',
    description: 'Обучающие материалы и полезная информация по работе с отчетами',
    icon: BookOpen,
  },
];

const faqItems = [
  {
    question: 'Как скачать отчет в формате Excel?',
    answer: 'В каждом разделе отчетов есть кнопка "Скачать Excel". Нажмите на нее, чтобы загрузить актуальный отчет.',
  },
  {
    question: 'Как часто обновляются данные?',
    answer: 'Данные обновляются автоматически каждый час или каждый день. Время последнего обновления указано в каждом отчете.',
  },
  {
    question: 'Отчет показывает неправильные данные, что делать?',
    answer: 'Отчеты формируются через выгрузку с портала "Наш город" и АРМ Префектур. Если данные неверны, это связано только с проблемами их стороны.',
  },
];

function Dashboard() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Информационная система Префектуры ЮВАО
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Добро пожаловать в информационную систему Префектуры ЮВАО. Здесь вы можете получить доступ к различным отчетам,
          аналитике и базе знаний для эффективной работы с обращениями граждан.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Отчеты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => (
            <Link
              key={report.id}
              to={`/report/${report.id}`}
              className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Дополнительные разделы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {additionalSections.map((section) => (
            <Link
              key={section.id}
              to={`/${section.id}`}
              className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <section.icon className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-purple-600" />
          Часто задаваемые вопросы
        </h2>
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {faqItems.map((item, index) => (
            <div key={index}>
              <h3 className="font-medium text-gray-900 mb-2">{item.question}</h3>
              <p className="text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;