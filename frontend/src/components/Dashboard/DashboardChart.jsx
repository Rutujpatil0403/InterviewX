// src/components/Dashboard/DashboardChart.jsx
import React from 'react';
import Card from '../Common/Card';

const DashboardChart = ({ title, data, type = 'line' }) => {
  // Simple chart component for demo purposes
  // In a real app, you'd use a charting library like Chart.js, Recharts, or D3
  
  const renderBarChart = () => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="flex items-end justify-between h-48 px-4 py-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 mx-1">
            <div className="w-full flex flex-col items-center">
              <div
                className="w-full bg-primary-500 rounded-t"
                style={{
                  height: `${(item.value / maxValue) * 160}px`,
                  minHeight: '4px'
                }}
              />
              <span className="text-xs text-secondary-600 mt-2 text-center">
                {item.label}
              </span>
              <span className="text-xs font-medium text-secondary-900">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLineChart = () => {
    if (!data || data.length === 0) return null;

    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-secondary-500">
          Line chart visualization would go here
          <br />
          <span className="text-xs">
            Integration with Chart.js or Recharts recommended
          </span>
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['bg-primary-500', 'bg-success-500', 'bg-warning-500', 'bg-secondary-500', 'bg-danger-500'];

    return (
      <div className="flex items-center">
        <div className="w-32 h-32 rounded-full border-8 border-secondary-200 flex items-center justify-center mr-6">
          <span className="text-sm text-secondary-600">Pie Chart</span>
        </div>
        <div className="flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-1">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2`} />
                <span className="text-sm text-secondary-700">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-secondary-900">{item.value}</span>
                <span className="text-xs text-secondary-500 ml-1">
                  ({Math.round((item.value / total) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
      default:
        return renderLineChart();
    }
  };

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-semibold text-secondary-900">
          {title}
        </h3>
      </Card.Header>
      <Card.Body>
        {data && data.length > 0 ? (
          renderChart()
        ) : (
          <div className="h-48 flex items-center justify-center text-secondary-500">
            No data available
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DashboardChart;
