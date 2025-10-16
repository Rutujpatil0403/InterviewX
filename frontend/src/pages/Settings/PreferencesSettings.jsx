// Preferences Settings Tab
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Palette, Globe, Clock, Save, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  SettingsSection, 
  SettingsSelect, 
  SettingsToggle 
} from '../../components/Settings';
import Button from '../../components/Common/Button';
import { settingsAPI } from '../../services/settingsAPI';

const PreferencesContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const PreferencesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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

const PreferencesSettings = () => {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    pageSize: 10,
    autoSave: true,
    compactMode: false
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    const userPrefs = settingsAPI.getUserPreferences();
    setPreferences(userPrefs);
  };

  const handleSelectChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToggleChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await settingsAPI.updateUserPreferences(preferences);
      
      // Apply theme change immediately if needed
      if (preferences.theme) {
        document.documentElement.setAttribute('data-theme', preferences.theme);
      }
      
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
    { value: 'Asia/Shanghai', label: 'China Standard Time' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time' }
  ];

  const dateFormatOptions = [
    { value: 'MM/dd/yyyy', label: '12/31/2023 (US)' },
    { value: 'dd/MM/yyyy', label: '31/12/2023 (UK)' },
    { value: 'yyyy-MM-dd', label: '2023-12-31 (ISO)' },
    { value: 'dd MMM yyyy', label: '31 Dec 2023' },
    { value: 'MMM dd, yyyy', label: 'Dec 31, 2023' }
  ];

  const timeFormatOptions = [
    { value: '12h', label: '12-hour (2:30 PM)' },
    { value: '24h', label: '24-hour (14:30)' }
  ];

  const pageSizeOptions = [
    { value: 5, label: '5 items per page' },
    { value: 10, label: '10 items per page' },
    { value: 20, label: '20 items per page' },
    { value: 50, label: '50 items per page' },
    { value: 100, label: '100 items per page' }
  ];

  return (
    <PreferencesContainer>
      <SettingsSection
        title="Appearance"
        description="Customize the look and feel of your interface"
      >
        <GroupTitle>
          <Palette size={16} />
          Display Settings
        </GroupTitle>
        
        <PreferencesGrid>
          <SettingsSelect
            id="theme"
            label="Theme"
            description="Choose your preferred color scheme"
            value={preferences.theme}
            onChange={(value) => handleSelectChange('theme', value)}
            options={themeOptions}
          />
          
          <div />
        </PreferencesGrid>
        
        <SettingsToggle
          id="compact-mode"
          label="Compact Mode"
          description="Use a more compact layout with reduced spacing"
          checked={preferences.compactMode}
          onChange={(value) => handleToggleChange('compactMode', value)}
        />
      </SettingsSection>

      <SettingsSection
        title="Localization"
        description="Configure language and regional settings"
      >
        <GroupTitle>
          <Globe size={16} />
          Language & Region
        </GroupTitle>
        
        <PreferencesGrid>
          <SettingsSelect
            id="language"
            label="Language"
            description="Select your preferred language"
            value={preferences.language}
            onChange={(value) => handleSelectChange('language', value)}
            options={languageOptions}
          />
          
          <SettingsSelect
            id="timezone"
            label="Timezone"
            description="Your local timezone for dates and times"
            value={preferences.timezone}
            onChange={(value) => handleSelectChange('timezone', value)}
            options={timezoneOptions}
          />
          
          <SettingsSelect
            id="date-format"
            label="Date Format"
            description="How dates should be displayed"
            value={preferences.dateFormat}
            onChange={(value) => handleSelectChange('dateFormat', value)}
            options={dateFormatOptions}
          />
          
          <SettingsSelect
            id="time-format"
            label="Time Format"
            description="12-hour or 24-hour time display"
            value={preferences.timeFormat}
            onChange={(value) => handleSelectChange('timeFormat', value)}
            options={timeFormatOptions}
          />
        </PreferencesGrid>
      </SettingsSection>

      <SettingsSection
        title="Interface Behavior"
        description="Configure how the interface behaves"
      >
        <GroupTitle>
          <Monitor size={16} />
          Interface Settings
        </GroupTitle>
        
        <SettingsSelect
          id="page-size"
          label="Page Size"
          description="Default number of items to show per page"
          value={preferences.pageSize}
          onChange={(value) => handleSelectChange('pageSize', parseInt(value))}
          options={pageSizeOptions}
        />
        
        <SettingsToggle
          id="auto-save"
          label="Auto-save"
          description="Automatically save changes as you type"
          checked={preferences.autoSave}
          onChange={(value) => handleToggleChange('autoSave', value)}
        />

        <Button
          onClick={handleSave}
          disabled={loading}
          loading={loading}
          size="md"
          variant="primary"
        >
          <Save size={16} />
          Save Preferences
        </Button>
      </SettingsSection>
    </PreferencesContainer>
  );
};

export default PreferencesSettings;