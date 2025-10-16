// src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Settings,
  Bot,
  X,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../utils/constants';

const SidebarOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop)
})`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: ${({ theme }) => theme.zIndices.overlay};
  display: ${({ isOpen }) => isOpen ? 'block' : 'none'};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const SidebarContainer = styled.aside.withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop)
})`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 16rem;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.light};
  z-index: ${({ theme }) => theme.zIndices.sidebar};
  transform: ${({ isOpen }) => isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: ${({ theme }) => theme.transitions.default};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: static;
    transform: translateX(0);
  }
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const LogoSection = styled.div`
  display: flex;
  height: 80.01px;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const LogoIcon = styled.div`
  width: 2rem;
  height: 2rem;
  background-color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: white;
  }
`;

const LogoText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.button`
  padding: ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: none;
  border: none;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const Navigation = styled.nav`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing[6]} ${theme.spacing[4]}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const NavigationLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  &.active {
    background-color: ${({ theme }) => theme.colors.primary[100]};
    color: ${({ theme }) => theme.colors.primary[700]};
    
    svg {
      color: ${({ theme }) => theme.colors.primary[600]};
    }
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: ${({ theme }) => theme.spacing[3]};
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const UserSection = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary[600]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserRole = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: [USER_ROLES.ADMIN, USER_ROLES.RECRUITER, USER_ROLES.CANDIDATE]
    },
    {
      name: 'Interviews',
      href: '/interviews',
      icon: Calendar,
      roles: [USER_ROLES.ADMIN, USER_ROLES.RECRUITER, USER_ROLES.CANDIDATE]
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FileText,
      roles: [USER_ROLES.ADMIN, USER_ROLES.RECRUITER]
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: [USER_ROLES.ADMIN, USER_ROLES.RECRUITER]
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      roles: [USER_ROLES.ADMIN]
    },
    {
      name: 'API Demo',
      href: '/integration-demo',
      icon: Activity,
      roles: [USER_ROLES.ADMIN]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: [USER_ROLES.ADMIN, USER_ROLES.RECRUITER, USER_ROLES.CANDIDATE]
    }
  ];

  const filteredItems = navigationItems.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      <SidebarOverlay isOpen={isOpen} onClick={onClose} />

      <SidebarContainer isOpen={isOpen}>
        <SidebarContent>
          <LogoSection>
            <LogoContainer>
              <LogoIcon>
                <Bot />
              </LogoIcon>
              <LogoText>
                InterviewX
              </LogoText>
            </LogoContainer>

            <CloseButton onClick={onClose}>
              <X />
            </CloseButton>
          </LogoSection>

          <Navigation>
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href ||
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

              return (
                <NavigationLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={isActive ? 'active' : ''}
                >
                  <Icon />
                  {item.name}
                </NavigationLink>
              );
            })}
          </Navigation>

          <UserSection>
            <UserInfo>
              <UserAvatar>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </UserAvatar>
              <UserDetails>
                <UserName>
                  {user?.name || 'User'}
                </UserName>
                <UserRole>
                  {user?.role || 'User'}
                </UserRole>
              </UserDetails>
            </UserInfo>
          </UserSection>
        </SidebarContent>
      </SidebarContainer>
    </>
  );
};

export default Sidebar;
