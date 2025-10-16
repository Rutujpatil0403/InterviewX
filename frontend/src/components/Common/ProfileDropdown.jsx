// Header Profile Dropdown Component
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  UserCircle2,
  Shield,
  Bell
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ProfileContainer = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray?.[100] || '#f3f4f6'};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary?.[500] || '#3b82f6'};
    outline-offset: 2px;
  }
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ hasImage, theme }) => 
    hasImage 
      ? 'transparent' 
      : `linear-gradient(135deg, ${theme.colors.primary?.[500] || '#3b82f6'} 0%, ${theme.colors.primary?.[600] || '#2563eb'} 100%)`
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  border: 2px solid ${({ theme }) => theme.colors.white || '#ffffff'};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserName = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const UserRole = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
  text-transform: capitalize;
`;

const ChevronIcon = styled(ChevronDown)`
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray?.[400] || '#9ca3af'};
  transition: transform 0.2s ease-in-out;
  transform: ${({ isOpen }) => isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  width: 280px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  opacity: ${({ isOpen }) => isOpen ? 1 : 0};
  visibility: ${({ isOpen }) => isOpen ? 'visible' : 'hidden'};
  transform: ${({ isOpen }) => isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'};
  transition: all 0.2s ease-in-out;
`;

const DropdownHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
`;

const DropdownUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DropdownAvatar = styled(UserAvatar)`
  width: 2.5rem;
  height: 2.5rem;
`;

const DropdownUserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const DropdownUserName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  margin-bottom: 0.125rem;
`;

const DropdownUserEmail = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
  word-break: break-all;
`;

const DropdownUserRole = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${({ theme }) => theme.colors.primary?.[50] || '#eff6ff'};
  color: ${({ theme }) => theme.colors.primary?.[700] || '#1d4ed8'};
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.5rem;
`;

const DropdownMenuList = styled.div`
  padding: 0.5rem;
`;

const DropdownMenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: none;
  border: none;
  text-align: left;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ variant, theme }) => {
    if (variant === 'danger') return theme.colors.red?.[600] || '#dc2626';
    return theme.colors.gray?.[700] || '#374151';
  }};
  transition: all 0.15s ease-in-out;
  
  &:hover {
    background-color: ${({ variant, theme }) => {
      if (variant === 'danger') return theme.colors.red?.[50] || '#fef2f2';
      return theme.colors.gray?.[50] || '#f9fafb';
    }};
  }
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary?.[500] || '#3b82f6'};
    outline-offset: -2px;
  }
  
  svg {
    width: 1.125rem;
    height: 1.125rem;
    color: ${({ variant, theme }) => {
      if (variant === 'danger') return theme.colors.red?.[500] || '#ef4444';
      return theme.colors.gray?.[400] || '#9ca3af';
    }};
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
  margin: 0.5rem 0;
`;

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
    setIsOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Shield size={12} />;
      case 'recruiter':
        return <User size={12} />;
      default:
        return <UserCircle2 size={12} />;
    }
  };

  if (!user) {
    return (
      <ProfileButton onClick={() => navigate('/login')}>
        <User size={20} />
      </ProfileButton>
    );
  }

  return (
    <ProfileContainer ref={dropdownRef}>
      <ProfileButton onClick={() => setIsOpen(!isOpen)}>
        <UserAvatar hasImage={!!user.profilePicture}>
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.name || 'Profile'} 
            />
          ) : (
            getInitials(user.name)
          )}
        </UserAvatar>
        
        <UserInfo>
          <UserName>{user.name || 'User'}</UserName>
          <UserRole>{user.role || 'User'}</UserRole>
        </UserInfo>
        
        <ChevronIcon isOpen={isOpen} />
      </ProfileButton>

      <DropdownMenu isOpen={isOpen}>
        <DropdownHeader>
          <DropdownUserInfo>
            <DropdownAvatar hasImage={!!user.profilePicture}>
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user.name || 'Profile'} 
                />
              ) : (
                getInitials(user.name)
              )}
            </DropdownAvatar>
            
            <DropdownUserDetails>
              <DropdownUserName>
                {user.name || 'User Name'}
              </DropdownUserName>
              <DropdownUserEmail>
                {user.email || 'user@example.com'}
              </DropdownUserEmail>
              <DropdownUserRole>
                {getRoleIcon(user.role)}
                {user.role || 'User'}
              </DropdownUserRole>
            </DropdownUserDetails>
          </DropdownUserInfo>
        </DropdownHeader>

        <DropdownMenuList>
          <DropdownMenuItem onClick={handleProfileClick}>
            <User />
            View Profile
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSettingsClick}>
            <Settings />
            Settings
          </DropdownMenuItem>
          
          <MenuDivider />
          
          <DropdownMenuItem 
            onClick={handleLogoutClick}
            variant="danger"
          >
            <LogOut />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuList>
      </DropdownMenu>
    </ProfileContainer>
  );
};

export default ProfileDropdown;