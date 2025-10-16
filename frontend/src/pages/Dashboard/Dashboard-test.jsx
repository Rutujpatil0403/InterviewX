import React from "react";
import styled from "styled-components";
import { H1, Text } from "../../components/styled/Typography";
import { Container } from "../../components/styled/Layout";
import { Card } from "../../components/styled/Components";
import { useAuth } from "../../hooks/useAuth";

const TestDashboard = styled(Container)`
  padding: 2rem;
`;

const WelcomeCard = styled(Card)`
  padding: 2rem;
  text-align: center;
`;

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <TestDashboard>
      <WelcomeCard>
        <H1>Welcome to InterviewX Dashboard!</H1>
        <Text>
          Hello {user?.name || "User"}! You have successfully logged in.
        </Text>
        <Text color="secondary" style={{ marginTop: "1rem" }}>
          This is the main dashboard where you can manage interviews, templates, and analytics.
        </Text>
      </WelcomeCard>
    </TestDashboard>
  );
};

export default Dashboard;
