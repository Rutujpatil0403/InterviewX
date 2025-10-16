// Notification Settings Tab
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bell, Mail, Smartphone, Clock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSelect 
} from '../../components/Settings';
import Button from '../../components/Common/Button';
import { settingsAPI } from '../../services/settingsAPI';

const NotificationContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const NotificationGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const GroupTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const QuietHoursGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: {
      interviewReminders: true,
      evaluationAlerts: true,
      systemNotifications: true,
      weeklyDigest: false
    },
    push: {
      interviewReminders: true,
      evaluationAlerts: true,
      systemNotifications: false,
      instantMessages: true
    },
    categories: {
      interview: true,
      evaluation: true,
      system: true,
      general: true,
      security: true
    },
    frequency: {
      immediate: true,
      digest: false,
      weekly: false
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'UTC'
    }
  });

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const prefs = await settingsAPI.getNotificationPreferences();
      if (prefs) {
        setNotifications(prefs);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const handleToggleChange = (category, key, value) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSelectChange = (category, key, value) => {
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await settingsAPI.updateNotificationPreferences(notifications);
      toast.success('Notification preferences updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' }
  ];

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayStr = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      timeOptions.push({ value: timeStr, label: displayStr });
    }
  }

  return (
    <NotificationContainer>
      <SettingsSection
        title="Email Notifications"
        description="Choose what email notifications you'd like to receive"
      >
        <NotificationGroup>
          <GroupTitle>
            <Mail size={16} />
            Email Preferences
          </GroupTitle>
          
          <SettingsToggle
            id="email-interview-reminders"
            label="Interview Reminders"
            description="Get email reminders before scheduled interviews"
            checked={notifications.email.interviewReminders}
            onChange={(value) => handleToggleChange('email', 'interviewReminders', value)}
          />
          
          <SettingsToggle
            id="email-evaluation-alerts"
            label="Evaluation Alerts"
            description="Receive notifications when evaluations are completed"
            checked={notifications.email.evaluationAlerts}
            onChange={(value) => handleToggleChange('email', 'evaluationAlerts', value)}
          />
          
          <SettingsToggle
            id="email-system-notifications"
            label="System Notifications"
            description="Important system updates and announcements"
            checked={notifications.email.systemNotifications}
            onChange={(value) => handleToggleChange('email', 'systemNotifications', value)}
          />
          
          <SettingsToggle
            id="email-weekly-digest"
            label="Weekly Digest"
            description="Weekly summary of your interview activity"
            checked={notifications.email.weeklyDigest}
            onChange={(value) => handleToggleChange('email', 'weeklyDigest', value)}
          />
        </NotificationGroup>
      </SettingsSection>

      <SettingsSection
        title="Push Notifications"
        description="Manage browser and device notifications"
      >
        <NotificationGroup>
          <GroupTitle>
            <Smartphone size={16} />
            Push Preferences
          </GroupTitle>
          
          <SettingsToggle
            id="push-interview-reminders"
            label="Interview Reminders"
            description="Push notifications for upcoming interviews"
            checked={notifications.push.interviewReminders}
            onChange={(value) => handleToggleChange('push', 'interviewReminders', value)}
          />
          
          <SettingsToggle
            id="push-evaluation-alerts"
            label="Evaluation Alerts"
            description="Instant notifications for new evaluations"
            checked={notifications.push.evaluationAlerts}
            onChange={(value) => handleToggleChange('push', 'evaluationAlerts', value)}
          />
          
          <SettingsToggle
            id="push-system-notifications"
            label="System Notifications"
            description="Critical system alerts and maintenance notices"
            checked={notifications.push.systemNotifications}
            onChange={(value) => handleToggleChange('push', 'systemNotifications', value)}
          />
          
          <SettingsToggle
            id="push-instant-messages"
            label="Instant Messages"
            description="Real-time chat and direct message notifications"
            checked={notifications.push.instantMessages}
            onChange={(value) => handleToggleChange('push', 'instantMessages', value)}
          />
        </NotificationGroup>
      </SettingsSection>

      <SettingsSection
        title="Categories"
        description="Choose which types of notifications you want to receive"
      >
        <NotificationGroup>
          <GroupTitle>
            <Bell size={16} />
            Notification Categories
          </GroupTitle>
          
          <SettingsToggle
            id="category-interview"
            label="Interview Notifications"
            description="All interview-related notifications"
            checked={notifications.categories.interview}
            onChange={(value) => handleToggleChange('categories', 'interview', value)}
          />
          
          <SettingsToggle
            id="category-evaluation"
            label="Evaluation Notifications"
            description="Evaluation and feedback notifications"
            checked={notifications.categories.evaluation}
            onChange={(value) => handleToggleChange('categories', 'evaluation', value)}
          />
          
          <SettingsToggle
            id="category-system"
            label="System Notifications"
            description="System updates and maintenance alerts"
            checked={notifications.categories.system}
            onChange={(value) => handleToggleChange('categories', 'system', value)}
          />
          
          <SettingsToggle
            id="category-general"
            label="General Notifications"
            description="General updates and announcements"
            checked={notifications.categories.general}
            onChange={(value) => handleToggleChange('categories', 'general', value)}
          />
          
          <SettingsToggle
            id="category-security"
            label="Security Notifications"
            description="Security alerts and login notifications"
            checked={notifications.categories.security}
            onChange={(value) => handleToggleChange('categories', 'security', value)}
          />
        </NotificationGroup>
      </SettingsSection>

      <SettingsSection
        title="Quiet Hours"
        description="Set times when you don't want to receive notifications"
      >
        <NotificationGroup>
          <GroupTitle>
            <Clock size={16} />
            Do Not Disturb
          </GroupTitle>
          
          <SettingsToggle
            id="quiet-hours-enabled"
            label="Enable Quiet Hours"
            description="Automatically disable notifications during specified times"
            checked={notifications.quietHours.enabled}
            onChange={(value) => handleToggleChange('quietHours', 'enabled', value)}
          />
          
          {notifications.quietHours.enabled && (
            <QuietHoursGrid>
              <SettingsSelect
                id="quiet-start-time"
                label="Start Time"
                value={notifications.quietHours.startTime}
                onChange={(value) => handleSelectChange('quietHours', 'startTime', value)}
                options={timeOptions}
                placeholder="Select start time"
              />
              
              <SettingsSelect
                id="quiet-end-time"
                label="End Time"
                value={notifications.quietHours.endTime}
                onChange={(value) => handleSelectChange('quietHours', 'endTime', value)}
                options={timeOptions}
                placeholder="Select end time"
              />
              
              <SettingsSelect
                id="quiet-timezone"
                label="Timezone"
                value={notifications.quietHours.timezone}
                onChange={(value) => handleSelectChange('quietHours', 'timezone', value)}
                options={timezoneOptions}
                placeholder="Select timezone"
              />
            </QuietHoursGrid>
          )}
        </NotificationGroup>

        <Button
          onClick={handleSave}
          disabled={loading}
          loading={loading}
          size="md"
          variant="primary"
        >
          <Save size={16} />
          Save Notification Preferences
        </Button>
      </SettingsSection>
    </NotificationContainer>
  );
};

export default NotificationSettings;