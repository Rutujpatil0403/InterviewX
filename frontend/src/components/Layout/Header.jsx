import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Bell, Search, Menu, X } from 'lucide-react';
import ProfileDropdown from '../Common/ProfileDropdown';

const HeaderContainer = styled.header`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.375rem;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  width: 300px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;


const Header = ({ onToggleSidebar, sidebarOpen }) => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <LeftSection>
          <Button onClick={onToggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <SearchInput placeholder="Search..." />
        </LeftSection>
        <RightSection>
          <Button><Search size={20} /></Button>
          <Button><Bell size={20} /></Button>
          <ProfileDropdown />
        </RightSection>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
