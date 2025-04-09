import React from 'react';
import { useParams } from 'react-router-dom';
import OurCityReport from './OurCityReport';
import MayorMonitorReport from './MayorMonitorReport';
import PrefectReport from './PrefectReport';
import MzhiReport from './MzhiReport';

function ReportViewer() {
  const { type } = useParams<{ type: string }>();

  const renderReport = () => {
    switch (type) {
      case 'our-city':
        return <OurCityReport />;
      case 'mayor-monitor':
        return <MayorMonitorReport />;
      case 'prefect':
        return <PrefectReport />;
      case 'mzhi':
        return <MzhiReport />;
      default:
        return <div>Отчет не найден</div>;
    }
  };

  return (
    <div>
      {renderReport()}
    </div>
  );
}

export default ReportViewer;
