// Main Settings Page
import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Shield, 
  Bell, 
  Settings as SettingsIcon, 
  Palette,
  Database
} from 'lucide-react';

import { SettingsTabs } from '../../components/Settings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import PreferencesSettings from './PreferencesSettings';
import SystemSettings from './SystemSettings';
import { useAuth } from '../../hooks/useAuth';

const SettingsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[6]};
`;

const SettingsHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SettingsTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const SettingsSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
`;

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('security');

  const tabs = [
    {
      id: 'security',
      label: 'Security',
      icon: <Shield size={16} />
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={16} />
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Palette size={16} />
    },
    // Only show system settings for Admin users
    ...(user?.role === 'Admin' ? [{
      id: 'system',
      label: 'System',
      icon: <Database size={16} />
    }] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'preferences':
        return <PreferencesSettings />;
      case 'system':
        return user?.role === 'Admin' ? <SystemSettings /> : null;
      default:
        return <SecuritySettings />;
    }
  };

  return (
    <SettingsContainer>
      <SettingsHeader>
        <SettingsTitle>
          <SettingsIcon size={28} style={{ verticalAlign: 'text-bottom', marginRight: '12px' }} />
          Settings
        </SettingsTitle>
        <SettingsSubtitle>
          Manage your security, notifications, and system preferences
        </SettingsSubtitle>
      </SettingsHeader>

      <SettingsTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
      </SettingsTabs>
    </SettingsContainer>
  );
};

export default Settings;