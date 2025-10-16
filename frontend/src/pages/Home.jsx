import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Brain, Users, Calendar, BarChart3, ArrowRight, Star, Zap, Shield, Clock } from "lucide-react";
import { Button, Card } from "../components/styled/Components";
import { H1, H2, H3, Text } from "../components/styled/Typography";
import { Container, Flex } from "../components/styled/Layout";

const HeroSection = styled.section`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6rem 0;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 4xl;
  margin: 0 auto;
  padding: 0 1rem;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const HeroButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
  }
`;

const HeroButton = styled(Button)`
  padding: 1rem 2rem;
  font-size: 1.125rem;
  border-radius: 0.5rem;
`;

const FeaturesSection = styled.section`
  padding: 6rem 0;
  background: white;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const FeatureCard = styled(Card)`
  padding: 2rem;
  text-align: center;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const FeatureIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  
  svg {
    width: 2rem;
    height: 2rem;
    color: white;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
`;

const CTASection = styled.section`
  background: #1f2937;
  color: white;
  padding: 6rem 0;
  text-align: center;
`;

const CTAContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
`;

const CTASubtitle = styled.p`
  font-size: 1.125rem;
  margin-bottom: 2rem;
  opacity: 0.8;
`;

const Home = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Evaluation",
      description: "Advanced natural language processing to evaluate candidates objectively and consistently."
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated interview scheduling with calendar integration and timezone support."
    },
    {
      icon: Users,
      title: "Real-time Interviews", 
      description: "Conduct live interviews with video chat, screen sharing, and collaborative tools."
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Comprehensive reports and insights to make data-driven hiring decisions."
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with GDPR compliance and data protection."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Reduce time-to-hire by 70% with automated screening and evaluation."
    }
  ];

  return (
    <>
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            Revolutionize Your Interview Process
          </HeroTitle>
          <HeroSubtitle>
            AI-powered interview platform that streamlines hiring, evaluates candidates objectively, and helps you find the best talent faster.
          </HeroSubtitle>
          <HeroButtons>
            <HeroButton as={Link} to="/register" variant="primary">
              Get Started Free
              <ArrowRight size={20} />
            </HeroButton>
            <HeroButton variant="outline" style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.3)" }}>
              Watch Demo
            </HeroButton>
          </HeroButtons>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <Container>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <H2 style={{ marginBottom: "1rem" }}>Why Choose InterviewX?</H2>
            <Text size="lg" color="secondary" style={{ maxWidth: "600px", margin: "0 auto" }}>
              Everything you need to conduct professional interviews and make better hiring decisions.
            </Text>
          </div>
          
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureIcon>
                  <feature.icon />
                </FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </Container>
      </FeaturesSection>

      <CTASection>
        <CTAContent>
          <CTATitle>Ready to Transform Your Hiring?</CTATitle>
          <CTASubtitle>
            Join thousands of companies already using InterviewX to hire better, faster.
          </CTASubtitle>
          <HeroButton as={Link} to="/register" variant="primary">
            Start Your Free Trial
            <ArrowRight size={20} />
          </HeroButton>
        </CTAContent>
      </CTASection>
    </>
  );
};

export default Home;
