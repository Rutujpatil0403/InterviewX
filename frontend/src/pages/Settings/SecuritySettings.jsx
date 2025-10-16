// Security Settings Tab
import React, { useState } from 'react';
import styled from 'styled-components';
import { Lock, Eye, EyeOff, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { SettingsSection, SettingsField } from '../../components/Settings';
import Button from '../../components/Common/Button';
import { settingsAPI } from '../../services/settingsAPI';

const SecurityContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const PasswordStrength = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const StrengthBar = styled.div.withConfig({
  shouldForwardProp: (prop) => !['active', 'strength'].includes(prop)
})`
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background-color: ${({ active, strength, theme }) => {
    if (!active) return theme.colors.gray[200];
    
    switch (strength) {
      case 'weak':
        return theme.colors.red[500];
      case 'medium':
        return theme.colors.yellow[500];
      case 'strong':
        return theme.colors.green[500];
      default:
        return theme.colors.gray[200];
    }
  }};
`;

const StrengthText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: ${({ theme }) => theme.spacing[1]} 0 0 0;
`;

const SecurityInfo = styled.div`
  background-color: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SecurityInfoTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary[800]};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const SecurityInfoText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary[700]};
  margin: 0;
  line-height: 1.5;
`;

const SecuritySettings = () => {
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const calculatePasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', score: 1 };
    
    let score = 0;
    
    // Length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Complexity
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { strength: 'weak', score: 2 };
    if (score <= 4) return { strength: 'medium', score: 3 };
    return { strength: 'strong', score: 4 };
  };

  const passwordStrength = calculatePasswordStrength(passwords.newPassword);

  const validatePasswords = () => {
    const errors = {};
    
    if (!passwords.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwords.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwords.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }
    
    if (!passwords.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwords.currentPassword === passwords.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear specific field error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    try {
      setLoading(true);
      
      await settingsAPI.changePassword(
        passwords.currentPassword,
        passwords.newPassword
      );
      
      // Reset form
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SecurityContainer>
      <SecurityInfo>
        <SecurityInfoTitle>
          <Shield size={16} />
          Security Guidelines
        </SecurityInfoTitle>
        <SecurityInfoText>
          Use a strong password with at least 8 characters, including uppercase letters, 
          lowercase letters, numbers, and special characters. Avoid using personal information 
          or common words.
        </SecurityInfoText>
      </SecurityInfo>

      <SettingsSection
        title="Change Password"
        description="Update your password to keep your account secure"
      >
        <form onSubmit={handleSubmit}>
          <SettingsField
            id="currentPassword"
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwords.currentPassword}
            onChange={(value) => handleInputChange('currentPassword', value)}
            error={passwordErrors.currentPassword}
            placeholder="Enter your current password"
            required
          />

          <SettingsField
            id="newPassword"
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwords.newPassword}
            onChange={(value) => handleInputChange('newPassword', value)}
            error={passwordErrors.newPassword}
            placeholder="Enter your new password"
            required
          />
          
          {passwords.newPassword && (
            <>
              <PasswordStrength>
                {[1, 2, 3, 4].map((index) => (
                  <StrengthBar
                    key={index}
                    active={index <= passwordStrength.score}
                    strength={passwordStrength.strength}
                  />
                ))}
              </PasswordStrength>
              <StrengthText>
                Password strength: {passwordStrength.strength}
              </StrengthText>
            </>
          )}

          <SettingsField
            id="confirmPassword"
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwords.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            error={passwordErrors.confirmPassword}
            placeholder="Confirm your new password"
            required
          />

          <Button
            type="submit"
            disabled={loading || Object.keys(passwordErrors).length > 0}
            loading={loading}
            size="md"
            variant="primary"
          >
            <Save size={16} />
            Update Password
          </Button>
        </form>
      </SettingsSection>
    </SecurityContainer>
  );
};

export default SecuritySettings;