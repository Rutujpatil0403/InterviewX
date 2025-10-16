import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, FileText, Edit, Trash2, Copy, Eye, Clock, Users } from "lucide-react";
import styled from "styled-components";
import { Button, Card, Badge } from "../../components/styled/Components";
import { Input, Select } from "../../components/styled/FormElements";
import { H1, H2, Text } from "../../components/styled/Typography";
import { Container } from "../../components/styled/Layout";
import { templateAPI } from "../../services/templateAPI";
import { toast } from "react-hot-toast";

const TemplatesContainer = styled(Container)`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const TemplatesGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TemplateCard = styled(Card)`
  padding: 1.5rem;
  transition: all 0.3s;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const TemplateInfo = styled.div`
  flex: 1;
`;

const TemplateName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const TemplateDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CategoryBadge = styled(Badge)`
  margin-bottom: 1rem;
`;

const TemplateStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
    color: #9ca3af;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  
  &.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
    
    &:hover {
      background: #2563eb;
    }
  }
  
  &.danger {
    color: #dc2626;
    border-color: #fecaca;
    
    &:hover {
      background: #fef2f2;
    }
  }
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
  
  svg {
    width: 4rem;
    height: 4rem;
    color: #d1d5db;
    margin: 0 auto 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  &::after {
    content: '';
    width: 2rem;
    height: 2rem;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
`;

const getCategoryVariant = (category) => {
  switch (category?.toLowerCase()) {
    case "technical":
      return "primary";
    case "behavioral":
      return "success";
    case "design":
      return "warning";
    case "management":
      return "secondary";
    default:
      return "secondary";
  }
};

const Templates = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    technical: 0,
    behavioral: 0,
    totalUsage: 0
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await templateAPI.getCategories();
        setCategories(response.data?.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 9,
        search: searchTerm,
        category: filterCategory !== 'all' ? filterCategory : '',
        difficulty: filterDifficulty !== 'all' ? filterDifficulty : ''
      };

      const response = await templateAPI.getTemplates(params);
      const { templates: fetchedTemplates, pagination } = response.data;

      setTemplates(fetchedTemplates || []);
      setTotalPages(pagination?.totalPages || 1);

      // Calculate stats
      const total = pagination?.totalTemplates || 0;
      const technical = fetchedTemplates?.filter(t => t.category === 'Technical').length || 0;
      const behavioral = fetchedTemplates?.filter(t => t.category === 'Behavioral').length || 0;

      setStats({
        total,
        technical,
        behavioral,
        totalUsage: total
      });
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterCategory, filterDifficulty]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterDifficulty]);

  const handleViewTemplate = (templateId) => {
    navigate(`/templates/${templateId}`);
  };

  const handleEditTemplate = (templateId) => {
    navigate(`/templates/${templateId}/edit`);
  };

  const handleCloneTemplate = async (e, template) => {
    e.stopPropagation();
    try {
      await templateAPI.cloneTemplate(template._id, {
        title: `Copy of ${template.title}`
      });
      toast.success('Template cloned successfully!');
      fetchTemplates();
    } catch (err) {
      console.error('Error cloning template:', err);
      toast.error(err.response?.data?.message || 'Failed to clone template');
    }
  };

  const handleDeleteTemplate = async (e, templateId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    try {
      await templateAPI.deleteTemplate(templateId);
      toast.success('Template deleted successfully!');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  if (loading && templates.length === 0) {
    return (
      <TemplatesContainer>
        <LoadingSpinner />
      </TemplatesContainer>
    );
  }

  return (
    <TemplatesContainer>
      <Header>
        <div>
          <H1>Interview Templates</H1>
          <Text color="secondary">Create and manage interview question templates</Text>
        </div>
        <HeaderActions>
          <Button variant="primary" onClick={() => navigate('/templates/create')}>
            <Plus size={16} />
            Create Template
          </Button>
        </HeaderActions>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatNumber>{stats.total}</StatNumber>
          <StatLabel>Total Templates</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.technical}</StatNumber>
          <StatLabel>Technical</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.behavioral}</StatNumber>
          <StatLabel>Behavioral</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{stats.totalUsage}</StatNumber>
          <StatLabel>Active Templates</StatLabel>
        </StatCard>
      </StatsGrid>

      <FiltersSection>
        <FiltersGrid>
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
          <Select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </FiltersGrid>
      </FiltersSection>

      {templates.length === 0 ? (
        <EmptyState>
          <FileText />
          <H2>No templates found</H2>
          <Text color="secondary" style={{ marginBottom: '1rem' }}>
            {searchTerm || filterCategory !== "all" 
              ? "Try adjusting your search or filters" 
              : "Create your first template to get started"
            }
          </Text>
          {!searchTerm && filterCategory === "all" && (
            <Button variant="primary" onClick={() => navigate('/templates/create')}>
              <Plus size={16} />
              Create Template
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <TemplatesGrid>
            {templates.map((template) => (
              <TemplateCard key={template._id} onClick={() => handleViewTemplate(template._id)}>
                <CardHeader>
                  <TemplateInfo>
                    <TemplateName>{template.title}</TemplateName>
                    <CategoryBadge variant={getCategoryVariant(template.category)}>
                      {template.category}
                    </CategoryBadge>
                  </TemplateInfo>
                </CardHeader>

                <TemplateDescription>{template.description || 'No description'}</TemplateDescription>

                <TemplateStats>
                  <StatItem>
                    <FileText />
                    <span>{template.questions?.length || 0} questions</span>
                  </StatItem>
                  <StatItem>
                    <Clock />
                    <span>{template.estimatedDuration} min</span>
                  </StatItem>
                  <StatItem>
                    <Badge variant="secondary" size="sm">{template.difficulty}</Badge>
                  </StatItem>
                </TemplateStats>

                <Text size="xs" color="secondary" style={{ marginBottom: "1rem" }}>
                  Created by {template.createdBy?.name || 'Unknown'}
                </Text>

                <CardActions onClick={(e) => e.stopPropagation()}>
                  <ActionButton onClick={() => handleViewTemplate(template._id)}>
                    <Eye />
                    View
                  </ActionButton>
                  <ActionButton onClick={(e) => handleCloneTemplate(e, template)}>
                    <Copy />
                    Clone
                  </ActionButton>
                  <ActionButton onClick={() => handleEditTemplate(template._id)}>
                    <Edit />
                    Edit
                  </ActionButton>
                  <ActionButton className="danger" onClick={(e) => handleDeleteTemplate(e, template._id)}>
                    <Trash2 />
                  </ActionButton>
                </CardActions>
              </TemplateCard>
            ))}
          </TemplatesGrid>

          {totalPages > 1 && (
            <PaginationContainer>
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </PaginationContainer>
          )}
        </>
      )}
    </TemplatesContainer>
  );
};

export default Templates;