import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Container, Flex, Box } from '../../components/styled/Layout';
import { H1, Text } from '../../components/styled/Typography';
import { Input, Select } from '../../components/styled/FormElements';
import { Button, Card, Badge } from '../../components/styled/Components';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useAPI';
import toast from 'react-hot-toast';

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const PageTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const ActionBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const SearchFilters = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    max-width: 600px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  
  svg {
    position: absolute;
    left: ${({ theme }) => theme.spacing[3]};
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.gray[400]};
    width: 1rem;
    height: 1rem;
  }
`;

const SearchInput = styled(Input)`
  padding-left: ${({ theme }) => theme.spacing[10]};
`;

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const UsersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const UserCard = styled(Card)`
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const UserCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
`;

const UserAvatar = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: ${({ theme }) => `linear-gradient(135deg, ${theme.colors.primary[500]}, ${theme.colors.primary[600]})`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled(Text)`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
`;

const UserEmail = styled(Text)`
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MenuButton = styled.button`
  padding: ${({ theme }) => theme.spacing[1]};
  border: none;
  background: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray[400]};
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
    color: ${({ theme }) => theme.colors.gray[400]};
    flex-shrink: 0;
  }
`;

const UserStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const StatCard = styled(Card)`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => `${theme.spacing[12]} ${theme.spacing[4]}`};
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const EmptyIcon = styled.div`
  width: 4rem;
  height: 4rem;
  margin: 0 auto ${({ theme }) => theme.spacing[4]};
  background-color: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 2rem;
    height: 2rem;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  
  // API hooks
  const { 
    data: usersData, 
    isLoading: loading, 
    error,
    refetch 
  } = useUsers({ 
    page, 
    limit: 20,
    search: searchTerm,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
  
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Process the API data
  const users = usersData?.users || [];
  const pagination = usersData?.pagination || {};
  
  // Stats come from API response or calculate from current data
  const stats = usersData?.stats || {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    interviewers: users.filter(u => u.role === 'interviewer').length
  };

  // Since filtering is done server-side, we use the users directly
  const filteredUsers = users;

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role) => {
    const colors = {
      'Admin': 'danger',
      'Interviewer': 'primary',
      'Candidate': 'success'
    };
    return colors[role] || 'gray';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'warning';
  };

  return (
    <Container>
      <PageHeader>
        <PageTitle>
          <H1>User Management</H1>
          <Text color="secondary">
            Manage users, roles, and permissions across your platform
          </Text>
        </PageTitle>

        {/* Statistics Cards */}
        <StatsContainer>
          <StatCard>
            <StatNumber>{stats.totalUsers}</StatNumber>
            <StatLabel>Total Users</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.activeUsers}</StatNumber>
            <StatLabel>Active Users</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.admins}</StatNumber>
            <StatLabel>Administrators</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.interviewers}</StatNumber>
            <StatLabel>Interviewers</StatLabel>
          </StatCard>
        </StatsContainer>

        {/* Action Bar */}
        <ActionBar>
          <SearchFilters>
            <SearchContainer>
              <Search />
              <SearchInput
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            
            <Select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="interviewer">Interviewer</option>
              <option value="candidate">Candidate</option>
            </Select>
            
            <Select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </SearchFilters>

          <ActionButtons>
            <Button variant="outline" size="sm">
              <Filter size={16} />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download size={16} />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload size={16} />
              Import
            </Button>
            <Button variant="primary" size="sm">
              <UserPlus size={16} />
              Add User
            </Button>
          </ActionButtons>
        </ActionBar>
      </PageHeader>

      {/* Users Grid */}
      {loading ? (
        <Box padding={8} textAlign="center">
          <Loader size={32} style={{ 
            margin: '0 auto 1rem', 
            animation: 'spin 1s linear infinite',
            display: 'block'
          }} />
          <Text>Loading users...</Text>
        </Box>
      ) : error ? (
        <Box padding={8} textAlign="center">
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
          <Text color="danger">Failed to load users</Text>
          <Button variant="outline" style={{ marginTop: '1rem' }} onClick={() => refetch()}>
            Try Again
          </Button>
        </Box>
      ) : filteredUsers.length > 0 ? (
        <UsersGrid>
          {filteredUsers.map((user) => (
            <UserCard key={user.id}>
              <UserCardHeader>
                <UserInfo>
                  <UserAvatar>
                    {getInitials(user.name)}
                  </UserAvatar>
                  <UserDetails>
                    <UserName>{user.name}</UserName>
                    <UserEmail>{user.email}</UserEmail>
                  </UserDetails>
                </UserInfo>
                <MenuButton>
                  <MoreHorizontal size={16} />
                </MenuButton>
              </UserCardHeader>

              <UserMeta>
                <MetaItem>
                  <Mail />
                  <span>{user.email}</span>
                </MetaItem>
                <MetaItem>
                  <Phone />
                  <span>{user.phone}</span>
                </MetaItem>
                <MetaItem>
                  <MapPin />
                  <span>{user.location}</span>
                </MetaItem>
              </UserMeta>

              <UserStatus>
                <Flex gap={2}>
                  <Badge color={getRoleColor(user.role)} size="sm">
                    {user.role}
                  </Badge>
                  <Badge color={getStatusColor(user.status)} size="sm">
                    {user.status}
                  </Badge>
                </Flex>
                <Text size="sm" color="secondary">
                  {user.interviewsCompleted} interviews
                </Text>
              </UserStatus>
            </UserCard>
          ))}
        </UsersGrid>
      ) : (
        <EmptyState>
          <EmptyIcon>
            <Search />
          </EmptyIcon>
          <H2>No users found</H2>
          <Text>
            Try adjusting your search criteria or filters to find what you're looking for.
          </Text>
        </EmptyState>
      )}
    </Container>
  );
};

export default UserManagement;