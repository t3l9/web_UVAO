import { useState, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { Script, ScriptFilter, ExcelRow } from '../types';
import { Filter, Search } from 'lucide-react';

function Scripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<Script[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState<ScriptFilter>({
    controlObject: '',
    status: '',
    problem: '',
    work: '',
  });

  const [filterOptions, setFilterOptions] = useState<{
    controlObjects: string[];
    statuses: string[];
    problems: string[];
    works: string[];
  }>({
    controlObjects: [],
    statuses: [],
    problems: [],
    works: [],
  });

  useEffect(() => {
    const loadScripts = async () => {
      try {
        const response = await fetch('/files/f1scripta.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = utils.sheet_to_json<ExcelRow>(worksheet, { raw: false });
        
        const formattedData = data.map(row => ({
          id: row['ID заявки'],
          controlObject: row['Объект контроля'],
          category: row['Категория'],
          problem: row['Проблема'],
          status: row['Статус'],
          work: row['Работы на объекте'],
          response: row['Текст ответа ОИВ'],
          documents: row['Документы/акты'],
          notes: row['Примечания'],
        }));

        setScripts(formattedData);

        // Получаем только уникальные объекты контроля для первого фильтра
        const controlObjects = [...new Set(formattedData.map(item => item.controlObject))].filter(Boolean);
        setFilterOptions(prev => ({
          ...prev,
          controlObjects
        }));
      } catch (error) {
        console.error('Error loading scripts:', error);
      }
    };

    loadScripts();
  }, []);

  // Обновляем опции фильтров на основе выбранных значений
  const updateFilterOptions = (currentFilters: ScriptFilter) => {
    let filtered = [...scripts];

    // Применяем фильтры последовательно
    if (currentFilters.controlObject) {
      filtered = filtered.filter(script => script.controlObject === currentFilters.controlObject);
    }
    if (currentFilters.status) {
      filtered = filtered.filter(script => script.status === currentFilters.status);
    }
    if (currentFilters.problem) {
      filtered = filtered.filter(script => script.problem === currentFilters.problem);
    }

    // Обновляем доступные опции для каждого фильтра
    const newOptions = {
      controlObjects: filterOptions.controlObjects, // Оставляем исходный список объектов контроля
      statuses: currentFilters.controlObject 
        ? [...new Set(filtered.filter(script => script.controlObject === currentFilters.controlObject).map(script => script.status))]
        : [],
      problems: currentFilters.status
        ? [...new Set(filtered.filter(script => script.status === currentFilters.status).map(script => script.problem))]
        : [],
      works: currentFilters.problem
        ? [...new Set(filtered.filter(script => script.problem === currentFilters.problem).map(script => script.work))]
        : [],
    };

    setFilterOptions(newOptions);
  };

  const handleFilterChange = (key: keyof ScriptFilter, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };

    // Сбрасываем последующие фильтры
    const keys = ['controlObject', 'status', 'problem', 'work'];
    const currentIndex = keys.indexOf(key);
    for (let i = currentIndex + 1; i < keys.length; i++) {
      newFilters[keys[i] as keyof ScriptFilter] = '';
    }

    setFilters(newFilters);
    updateFilterOptions(newFilters);
    setShowResults(false);
  };

  const applyFilters = () => {
    let filtered = [...scripts];

    if (filters.controlObject) {
      filtered = filtered.filter(script => script.controlObject === filters.controlObject);
    }
    if (filters.status) {
      filtered = filtered.filter(script => script.status === filters.status);
    }
    if (filters.problem) {
      filtered = filtered.filter(script => script.problem === filters.problem);
    }
    if (filters.work) {
      filtered = filtered.filter(script => script.work === filters.work);
    }

    setFilteredScripts(filtered);
    setShowResults(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Скрипты ответов</h1>
        <p className="text-gray-600">
          Используйте фильтры для поиска готовых ответов на обращения граждан.
          Выбирайте параметры последовательно и нажмите "Найти" для получения результатов.
          Важно: внимательно ознакомьтесь с содержанием ответа, поскольку названия документов и компаний заменены на общие (например, "ООО Ромашка" и т.д.).
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Фильтры</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            value={filters.controlObject}
            onChange={(e) => handleFilterChange('controlObject', e.target.value)}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Объект контроля</option>
            {filterOptions.controlObjects.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={!filters.controlObject}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          >
            <option value="">Статус</option>
            {filterOptions.statuses.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={filters.problem}
            onChange={(e) => handleFilterChange('problem', e.target.value)}
            disabled={!filters.status}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          >
            <option value="">Проблема</option>
            {filterOptions.problems.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            value={filters.work}
            onChange={(e) => handleFilterChange('work', e.target.value)}
            disabled={!filters.problem}
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          >
            <option value="">Работы на объекте</option>
            {filterOptions.works.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={applyFilters}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Search className="w-5 h-5" />
            Найти
          </button>
        </div>
      </div>

      {showResults && (
        <div className="grid grid-cols-1 gap-6">
          {filteredScripts.length > 0 ? (
            filteredScripts.map((script) => (
              <div key={script.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Информация о проблеме</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-600">ID заявки</dt>
                        <dd className="font-medium">{script.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Объект контроля</dt>
                        <dd className="font-medium">{script.controlObject}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Категория</dt>
                        <dd className="font-medium">{script.category}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Проблема</dt>
                        <dd className="font-medium">{script.problem}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Статус</dt>
                        <dd className="font-medium">{script.status}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Работы на объекте</dt>
                        <dd className="font-medium">{script.work}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Ответ и документация</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm text-gray-600">Текст ответа ОИВ</h4>
                        <p className="mt-1 text-gray-800 whitespace-pre-wrap">{script.response}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-gray-600">Документы/акты</h4>
                        <p className="mt-1 text-gray-800 whitespace-pre-wrap">{script.documents}</p>
                      </div>
                      {script.notes && (
                        <div>
                          <h4 className="text-sm text-gray-600">Примечания</h4>
                          <p className="mt-1 text-gray-800 whitespace-pre-wrap">{script.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600">По выбранным фильтрам ничего не найдено</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Scripts;