// src/components/Dashboard/UpcomingInterviews.jsx
import React from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Video,
  Phone,
  ExternalLink,
  MoreVertical
} from 'lucide-react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Badge from '../Common/Badge';
import { formatDate, formatTime } from '../../utils/helpers';

const UpcomingInterviews = ({ 
  interviews = [], 
  loading = false, 
  onJoinInterview,
  onViewDetails,
  userRole = 'Candidate'
}) => {
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return { variant: 'primary', text: 'Scheduled' };
      case 'in_progress':
        return { variant: 'warning', text: 'In Progress' };
      case 'completed':
        return { variant: 'success', text: 'Completed' };
      case 'cancelled':
        return { variant: 'danger', text: 'Cancelled' };
      default:
        return { variant: 'secondary', text: status };
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return Video;
      case 'phone':
        return Phone;
      case 'in_person':
        return MapPin;
      default:
        return Video;
    }
  };

  const isInterviewSoon = (dateTime) => {
    const interviewTime = new Date(dateTime);
    const now = new Date();
    const timeDiff = interviewTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    return minutesDiff <= 15 && minutesDiff > 0;
  };

  const canJoinInterview = (interview) => {
    const interviewTime = new Date(interview.scheduledAt || interview.InterviewDate);
    const now = new Date();
    const timeDiff = interviewTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Can join 15 minutes before and up to 2 hours after
    return minutesDiff <= 15 && minutesDiff > -120;
  };

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-secondary-900">
            Upcoming Interviews
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center animate-pulse">
                <div className="w-12 h-12 bg-secondary-200 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-secondary-200 rounded"></div>
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
            Upcoming Interviews
          </h3>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" size="sm">
              {interviews.length} interviews
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => onViewDetails?.('all')}>
              View All
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {interviews.length > 0 ? (
          <div className="divide-y divide-secondary-200">
            {interviews.map((interview) => {
              const statusBadge = getStatusBadge(interview.status || interview.Status);
              const TypeIcon = getInterviewTypeIcon(interview.type);
              const isSoon = isInterviewSoon(interview.scheduledAt || interview.InterviewDate);
              const canJoin = canJoinInterview(interview);
              
              return (
                <div 
                  key={interview.id || interview.InterviewID} 
                  className={`p-4 hover:bg-secondary-50 transition-colors ${isSoon ? 'bg-warning-50 border-l-4 border-warning-400' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      {/* Interview Type Icon */}
                      <div className="flex-shrink-0 mr-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-primary-600" />
                        </div>
                      </div>
                      
                      {/* Interview Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-secondary-900">
                              {userRole === 'Recruiter' ? (
                                interview.candidateName || interview.CandidateName || 'Unknown Candidate'
                              ) : (
                                interview.position || interview.TemplateName || 'Interview'
                              )}
                            </h4>
                            
                            <div className="flex items-center mt-1 text-xs text-secondary-600">
                              {userRole === 'Recruiter' ? (
                                <span>{interview.position || interview.TemplateName}</span>
                              ) : (
                                <div className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  <span>{interview.recruiterName || interview.RecruiterName || 'Recruiter'}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center mt-2 text-xs text-secondary-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>
                                {formatDate(interview.scheduledAt || interview.InterviewDate, 'MMM dd, yyyy')}
                              </span>
                              <span className="mx-2">•</span>
                              <Clock className="w-3 h-3 mr-1" />
                              <span>
                                {formatTime(interview.scheduledAt || interview.InterviewTime)}
                              </span>
                              {interview.duration && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{interview.duration} min</span>
                                </>
                              )}
                            </div>
                            
                            {isSoon && (
                              <div className="mt-2">
                                <Badge variant="warning" size="sm">
                                  Starting Soon
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Status Badge */}
                          <div className="ml-2 flex-shrink-0">
                            <Badge variant={statusBadge.variant} size="sm">
                              {statusBadge.text}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            {canJoin && interview.status !== 'completed' && (
                              <Button 
                                size="sm" 
                                variant={isSoon ? 'primary' : 'secondary'}
                                onClick={() => onJoinInterview?.(interview)}
                              >
                                <Video className="w-3 h-3 mr-1" />
                                Join
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => onViewDetails?.(interview)}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {/* Handle more options */}}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
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
            <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-600 font-medium">No upcoming interviews</p>
            <p className="text-xs text-secondary-500 mt-1">
              {userRole === 'Recruiter' 
                ? 'Schedule interviews to see them here' 
                : 'Your upcoming interviews will appear here'
              }
            </p>
            {userRole === 'Recruiter' && (
              <Button size="sm" className="mt-3">
                Schedule Interview
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default UpcomingInterviews;
