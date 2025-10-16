// src/components/Dashboard/RecentActivity.jsx
import React from 'react';
import { 
  Calendar, 
  CheckCircle, 
  FileText, 
  Users, 
  Clock,
  MessageSquare,
  Award,
  Settings
} from 'lucide-react';
import Card from '../Common/Card';
import Badge from '../Common/Badge';
import { formatDate } from '../../utils/helpers';

const RecentActivity = ({ activities = [], loading = false }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'interview_completed':
        return CheckCircle;
      case 'interview_scheduled':
        return Calendar;
      case 'template_created':
        return FileText;
      case 'evaluation_submitted':
        return Award;
      case 'feedback_received':
        return MessageSquare;
      case 'user_registered':
        return Users;
      case 'interview_started':
        return Clock;
      case 'settings_updated':
        return Settings;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'interview_completed':
      case 'evaluation_submitted':
        return 'text-success-500';
      case 'interview_scheduled':
      case 'interview_started':
        return 'text-primary-500';
      case 'template_created':
      case 'feedback_received':
        return 'text-warning-500';
      case 'user_registered':
        return 'text-secondary-500';
      case 'settings_updated':
        return 'text-purple-500';
      default:
        return 'text-secondary-500';
    }
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case 'interview_completed':
        return { variant: 'success', text: 'Completed' };
      case 'interview_scheduled':
        return { variant: 'primary', text: 'Scheduled' };
      case 'template_created':
        return { variant: 'warning', text: 'Created' };
      case 'evaluation_submitted':
        return { variant: 'success', text: 'Evaluated' };
      case 'feedback_received':
        return { variant: 'warning', text: 'Feedback' };
      case 'user_registered':
        return { variant: 'secondary', text: 'New User' };
      case 'interview_started':
        return { variant: 'primary', text: 'In Progress' };
      case 'settings_updated':
        return { variant: 'secondary', text: 'Updated' };
      default:
        return { variant: 'secondary', text: 'Activity' };
    }
  };

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-secondary-900">
            Recent Activity
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start animate-pulse">
                <div className="w-8 h-8 bg-secondary-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900">
            Recent Activity
          </h3>
          <Badge variant="secondary" size="sm">
            {activities.length} items
          </Badge>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {activities.length > 0 ? (
          <div className="divide-y divide-secondary-200">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const badge = getActivityBadge(activity.type);
              
              return (
                <div key={activity.id || index} className="p-4 hover:bg-secondary-50 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`p-2 rounded-full bg-secondary-100`}>
                        <Icon className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-secondary-900 font-medium">
                            {activity.message || activity.description}
                          </p>
                          {activity.details && (
                            <p className="text-xs text-secondary-600 mt-1">
                              {activity.details}
                            </p>
                          )}
                          <div className="flex items-center mt-2">
                            <p className="text-xs text-secondary-500">
                              {formatDate(activity.timestamp || activity.createdAt, 'MMM dd, HH:mm')}
                            </p>
                            {activity.user && (
                              <>
                                <span className="mx-1 text-secondary-400">•</span>
                                <span className="text-xs text-secondary-500">
                                  by {activity.user}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-2 flex-shrink-0">
                          <Badge variant={badge.variant} size="sm">
                            {badge.text}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600">No recent activity</p>
            <p className="text-xs text-secondary-500 mt-1">
              Activity will appear here as you use the platform
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default RecentActivity;
