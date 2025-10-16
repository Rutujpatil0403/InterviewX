import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Building, Camera, Upload, Edit3 } from 'lucide-react';
import styled, { ThemeProvider } from 'styled-components';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import toast from 'react-hot-toast';
// import LoadingSpinner from '../Common/LoadingSpinner';
import { theme } from '../../theme/theme';
import { userAPI } from '../../services/userAPI';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing[8]} 0;
`;

const Wrapper = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing[4]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0 ${({ theme }) => theme.spacing[6]};
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 0 ${({ theme }) => theme.spacing[8]};
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[8]};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

const TabsContainer = styled(Card)`
  box-shadow: ${({ theme }) => theme.shadows.base};
`;

const TabsNav = styled.nav`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  padding: 0 ${({ theme }) => theme.spacing[6]};
  gap: ${({ theme }) => theme.spacing[8]};
  overflow-x: auto;
`;

const TabButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[1]};
  border-bottom: 2px solid transparent;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: ${({ theme }) => theme.transitions.default};
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  
  ${({ active, theme }) => active ? `
    border-bottom-color: ${theme.colors.primary[600]};
    color: ${theme.colors.primary[600]};
  ` : `
    color: ${theme.colors.text.secondary};
    
    &:hover {
      color: ${theme.colors.text.primary};
      border-bottom-color: ${theme.colors.border.medium};
    }
  `}
  
  svg {
    margin-right: ${({ theme }) => theme.spacing[2]};
    width: 1.25rem;
    height: 1.25rem;
    transition: ${({ theme }) => theme.transitions.default};
    color: ${({ active, theme }) => active ? theme.colors.primary[600] : theme.colors.gray[400]};
  }
  
  &:hover svg {
    color: ${({ active, theme }) => active ? theme.colors.primary[600] : theme.colors.text.secondary};
  }
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing[8]};
`;

// Profile Picture Section
const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[10]};
  padding: ${({ theme }) => theme.spacing[8]};
  background: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const AvatarContainer = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Avatar = styled.div`
  width: 8rem;
  height: 8rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ hasImage }) => hasImage 
    ? 'transparent' 
    : `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.secondary[500]} 100%)`
  };
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  border: 4px solid ${({ theme }) => theme.colors.white};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CameraButton = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary[600]};
  border: 3px solid ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const ProfileInfo = styled.div`
  text-align: center;
`;

const ProfileName = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ProfileRole = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const HiddenFileInput = styled.input`
  display: none;
`;

// Information Sections
const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[10]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  padding-bottom: ${({ theme }) => theme.spacing[4]};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border.light};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  flex: 1;
`;

const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
    border-color: ${({ theme }) => theme.colors.primary[300]};
    color: ${({ theme }) => theme.colors.primary[600]};
  }
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoItem = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.border.medium};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

const InfoLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const InfoValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  
  &.empty {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-style: italic;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  justify-content: flex-end;
`;

const NotificationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const NotificationCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const NotificationCategory = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const NotificationLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Toggle = styled.button`
  position: relative;
  display: inline-flex;
  height: 1.5rem;
  width: 2.75rem;
  align-items: center;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: ${({ theme }) => theme.transitions.default};
  cursor: pointer;
  border: none;
  
  ${({ checked, theme }) => checked ? `
    background-color: ${theme.colors.primary[600]};
  ` : `
    background-color: ${theme.colors.gray[300]};
  `}
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const ToggleThumb = styled.span`
  display: inline-block;
  height: 1rem;
  width: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.colors.white};
  transition: ${({ theme }) => theme.transitions.default};
  box-shadow: ${({ theme }) => theme.shadows.xs};
  
  ${({ checked }) => checked ? `
    transform: translateX(1.25rem);
  ` : `
    transform: translateX(0.25rem);
  `}
`;

const Profile = () => {
  // State for user data from API
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    department: ''
  });

  const fileInputRef = useRef(null);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      
      if (response.success && response.data.user) {
        const user = response.data.user;
        console.log("Profile Data : ", user);
        setUserData(user);
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          company: user.company || '',
          department: user.department || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      try {
        setUploading(true);
        const response = await userAPI.uploadProfilePicture(file);
        
        if (response.success) {
          toast.success('Profile picture updated successfully!');
          // Update local state with new profile picture
          setUserData(prev => ({
            ...prev,
            profilePicture: response.data.profilePicture
          }));
        }
      } catch (error) {
        console.error('Failed to upload profile picture:', error);
        toast.error(error.response?.data?.message || 'Failed to upload profile picture');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(profileData);
      
      if (response.success && response.data.user) {
        setUserData(response.data.user);
        setEditingProfile(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  // Show loading state while fetching data
  if (loading && !userData) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Wrapper>
            <Header>
              <Title>Loading...</Title>
            </Header>
          </Wrapper>
        </Container>
      </ThemeProvider>
    );
  }

  // Show error state if no user data
  if (!userData) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Wrapper>
            <Header>
              <Title>Error</Title>
              <Subtitle>Failed to load profile data</Subtitle>
            </Header>
          </Wrapper>
        </Container>
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div>
            {/* Profile Picture Section */}
            <ProfileSection>
              <AvatarContainer>
                <Avatar hasImage={!!userData.profilePicture}>
                  {userData.profilePicture ? (
                    <img src={userData.profilePicture} alt="Profile" />
                  ) : (
                    getInitials(userData.name)
                  )}
                </Avatar>
                <CameraButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Camera />
                </CameraButton>
                <HiddenFileInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                />
              </AvatarContainer>
              <ProfileInfo>
                <ProfileName>{userData.name || 'User Name'}</ProfileName>
                <ProfileRole>{userData.role}</ProfileRole>
                <Button
                  variant="outline"
                  leftIcon={<Upload size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload New Picture'}
                </Button>
              </ProfileInfo>
            </ProfileSection>

            {/* Personal Information Section */}
            <Section>
              <SectionHeader>
                <SectionTitle>Personal Information</SectionTitle>
                <EditButton onClick={() => setEditingProfile(!editingProfile)}>
                  <Edit3 />
                  {editingProfile ? 'Cancel' : 'Edit'}
                </EditButton>
              </SectionHeader>

              {editingProfile ? (
                <div>
                  <FormGrid>
                    <Input
                      label="Full Name"
                      type="text"
                      leftIcon={<User size={16} />}
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      placeholder="Enter your full name"
                      required
                    />
                    
                    <Input
                      label="Email"
                      type="email"
                      leftIcon={<Mail size={16} />}
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      placeholder="Enter your email"
                      required
                    />
                    
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                    />
                    
                    <Input
                      label="Company"
                      type="text"
                      leftIcon={<Building size={16} />}
                      value={profileData.company}
                      onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                      placeholder="Enter your company"
                    />
                    
                    <Input
                      label="Department"
                      type="text"
                      value={profileData.department}
                      onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                      placeholder="Enter your department"
                    />
                  </FormGrid>
                  
                  <ButtonGroup>
                    <Button
                      variant="secondary"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleProfileUpdate}
                      loading={loading}
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </ButtonGroup>
                </div>
              ) : (
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Full Name</InfoLabel>
                    <InfoValue className={!userData.name ? 'empty' : ''}>
                      {userData.name || 'Not provided'}
                    </InfoValue>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoLabel>Email</InfoLabel>
                    <InfoValue>{userData.email}</InfoValue>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoLabel>Phone Number</InfoLabel>
                    <InfoValue className={!userData.phone ? 'empty' : ''}>
                      {userData.phone || 'Not provided'}
                    </InfoValue>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoLabel>Company</InfoLabel>
                    <InfoValue className={!userData.company ? 'empty' : ''}>
                      {userData.company || 'Not provided'}
                    </InfoValue>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoLabel>Department</InfoLabel>
                    <InfoValue className={!userData.department ? 'empty' : ''}>
                      {userData.department || 'Not provided'}
                    </InfoValue>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoLabel>Role</InfoLabel>
                    <InfoValue>{userData.role}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              )}
            </Section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Wrapper>
          {/* Header */}
          <Header>
            <Title>Profile Settings</Title>
            <Subtitle>
              Manage your account settings and preferences
            </Subtitle>
          </Header>

          {/* Tabs Container */}
          <TabsContainer>
            {/* Tabs Navigation */}
            <TabsNav>
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon />
                  {tab.label}
                </TabButton>
              ))}
            </TabsNav>
            
            {/* Content */}
            <Content>
              {renderContent()}
            </Content>
          </TabsContainer>
        </Wrapper>
      </Container>
    </ThemeProvider>
  );
};

export default Profile;