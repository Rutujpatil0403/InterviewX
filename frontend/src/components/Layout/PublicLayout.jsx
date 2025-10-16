import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Zap } from "lucide-react";

const PublicLayoutContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray[50]};
`;

const Header = styled.header`
  background-color: white;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const HeaderContainer = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[4]}`};
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.gray[900]};

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const LogoIcon = styled.div`
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: white;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
  }
`;

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LoginButton = styled(Link)`
  text-decoration: none;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const SignupButton = styled(Link)`
  text-decoration: none;
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const Main = styled.main`
  flex: 1;
`;

const Footer = styled.footer`
  background-color: white;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: 3rem 0;
`;

const FooterContainer = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[4]};
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const FooterSection = styled.div`
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray[900]};
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.5rem;
  }

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.gray[600]};
    font-size: 0.875rem;
    transition: color 0.2s;

    &:hover {
      color: ${({ theme }) => theme.colors.gray[900]};
    }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 0.875rem;
  margin: 0;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  a {
    color: ${({ theme }) => theme.colors.gray[400]};
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${({ theme }) => theme.colors.gray[600]};
    }
  }
`;

const PublicLayout = ({ children }) => {
  return (
    <PublicLayoutContainer>
      <Header>
        <HeaderContainer>
          <Nav>
            <Logo to="/">
              <LogoIcon>
                <Zap />
              </LogoIcon>
              InterviewX
            </Logo>
            <NavLinks>
              <NavLink to="/features">Features</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </NavLinks>
            <AuthButtons>
              <LoginButton to="/login">Login</LoginButton>
              <SignupButton to="/register">Get Started</SignupButton>
            </AuthButtons>
          </Nav>
        </HeaderContainer>
      </Header>

      <Main>{children}</Main>

      <Footer>
        <FooterContainer>
          <FooterContent>
            <FooterSection>
              <h3>Product</h3>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#integrations">Integrations</a></li>
                <li><a href="#api">API</a></li>
              </ul>
            </FooterSection>
            <FooterSection>
              <h3>Company</h3>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#press">Press</a></li>
              </ul>
            </FooterSection>
            <FooterSection>
              <h3>Support</h3>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#status">Status</a></li>
                <li><a href="#community">Community</a></li>
              </ul>
            </FooterSection>
            <FooterSection>
              <h3>Legal</h3>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#compliance">Compliance</a></li>
              </ul>
            </FooterSection>
          </FooterContent>
          <FooterBottom>
            <Copyright> 2025 InterviewX. All rights reserved.</Copyright>
            <SocialLinks>
              <a href="#twitter">Twitter</a>
              <a href="#linkedin">LinkedIn</a>
              <a href="#github">GitHub</a>
            </SocialLinks>
          </FooterBottom>
        </FooterContainer>
      </Footer>
    </PublicLayoutContainer>
  );
};

export default PublicLayout;
