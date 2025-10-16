// System Settings Tab (Admin Only)
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Database, Settings as SettingsIcon, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  SettingsSection, 
  SettingsToggle, 
  SettingsField 
} from '../../components/Settings';
import Button from '../../components/Common/Button';
import { settingsAPI } from '../../services/settingsAPI';

const SystemContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const WarningBox = styled.div`
  background-color: ${({ theme }) => theme.colors.yellow[50]};
  border: 1px solid ${({ theme }) => theme.colors.yellow[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const WarningTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.yellow[800]};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const WarningText = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.yellow[700]};
  margin: 0;
  line-height: 1.5;
`;

const SystemGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GroupTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSize.md};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SystemSettings = () => {
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    maintenance: false,
    registrationEnabled: true,
    emailNotifications: true,
    maxFileSize: '10',
    sessionTimeout: '24',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
    requireTwoFactor: false,
    allowGuestAccess: false,
    autoBackup: true,
    debugMode: false
  });

  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      const settings = await settingsAPI.getSystemSettings();
      if (settings) {
        setSystemSettings({
          ...systemSettings,
          ...settings
        });
      }
    } catch (error) {
      console.error('Failed to load system settings:', error);
    }
  };

  const handleToggleChange = (key, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFieldChange = (key, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await settingsAPI.updateSystemSettings(systemSettings);
      toast.success('System settings updated successfully');
    } catch (error) {
      toast.error('Failed to update system settings. Some settings may not be available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SystemContainer>
      <WarningBox>
        <WarningTitle>
          <AlertTriangle size={16} />
          Administrator Access Required
        </WarningTitle>
        <WarningText>
          These settings affect the entire system. Changes may impact all users. 
          Please review carefully before saving.
        </WarningText>
      </WarningBox>

      <SettingsSection
        title="System Status"
        description="Control system-wide features and maintenance mode"
      >
        <GroupTitle>
          <SettingsIcon size={16} />
          General Settings
        </GroupTitle>
        
        <SettingsToggle
          id="maintenance-mode"
          label="Maintenance Mode"
          description="Put the system into maintenance mode to prevent user access during updates"
          checked={systemSettings.maintenance}
          onChange={(value) => handleToggleChange('maintenance', value)}
        />
        
        <SettingsToggle
          id="registration-enabled"
          label="User Registration"
          description="Allow new users to register for accounts"
          checked={systemSettings.registrationEnabled}
          onChange={(value) => handleToggleChange('registrationEnabled', value)}
        />
        
        <SettingsToggle
          id="email-notifications"
          label="System Email Notifications"
          description="Enable system-wide email notification delivery"
          checked={systemSettings.emailNotifications}
          onChange={(value) => handleToggleChange('emailNotifications', value)}
        />
        
        <SettingsToggle
          id="guest-access"
          label="Guest Access"
          description="Allow limited access for non-authenticated users"
          checked={systemSettings.allowGuestAccess}
          onChange={(value) => handleToggleChange('allowGuestAccess', value)}
        />
      </SettingsSection>

      <SettingsSection
        title="Security Settings"
        description="Configure system-wide security policies"
      >
        <GroupTitle>
          <Database size={16} />
          Security & Access Control
        </GroupTitle>
        
        <SystemGrid>
          <SettingsField
            id="max-login-attempts"
            label="Max Login Attempts"
            type="number"
            value={systemSettings.maxLoginAttempts}
            onChange={(value) => handleFieldChange('maxLoginAttempts', value)}
            description="Maximum failed login attempts before account lockout"
            min="1"
            max="10"
          />
          
          <SettingsField
            id="session-timeout"
            label="Session Timeout (hours)"
            type="number"
            value={systemSettings.sessionTimeout}
            onChange={(value) => handleFieldChange('sessionTimeout', value)}
            description="Automatic session timeout in hours"
            min="1"
            max="168"
          />
          
          <SettingsField
            id="password-min-length"
            label="Minimum Password Length"
            type="number"
            value={systemSettings.passwordMinLength}
            onChange={(value) => handleFieldChange('passwordMinLength', value)}
            description="Minimum required password length for new accounts"
            min="6"
            max="32"
          />
          
          <SettingsField
            id="max-file-size"
            label="Max File Size (MB)"
            type="number"
            value={systemSettings.maxFileSize}
            onChange={(value) => handleFieldChange('maxFileSize', value)}
            description="Maximum file upload size in megabytes"
            min="1"
            max="100"
          />
        </SystemGrid>
        
        <SettingsToggle
          id="require-two-factor"
          label="Require Two-Factor Authentication"
          description="Enforce 2FA for all user accounts (Admin accounts only for now)"
          checked={systemSettings.requireTwoFactor}
          onChange={(value) => handleToggleChange('requireTwoFactor', value)}
        />
      </SettingsSection>

      <SettingsSection
        title="System Maintenance"
        description="Configure automated system maintenance and backup settings"
      >
        <SettingsToggle
          id="auto-backup"
          label="Automatic Backups"
          description="Enable daily automated system backups"
          checked={systemSettings.autoBackup}
          onChange={(value) => handleToggleChange('autoBackup', value)}
        />
        
        <SettingsToggle
          id="debug-mode"
          label="Debug Mode"
          description="Enable detailed logging for troubleshooting (may affect performance)"
          checked={systemSettings.debugMode}
          onChange={(value) => handleToggleChange('debugMode', value)}
        />

        <Button
          onClick={handleSave}
          disabled={loading}
          loading={loading}
          size="md"
          variant="primary"
        >
          <Save size={16} />
          Save System Settings
        </Button>
      </SettingsSection>
    </SystemContainer>
  );
};

export default SystemSettings;