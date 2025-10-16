import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import styled, { keyframes } from "styled-components";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Zap, Check, Phone, Building2, Briefcase } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Input, Select } from "../../components/styled/FormElements";
import { Button, Card } from "../../components/styled/Components";
import { H2, Text } from "../../components/styled/Typography";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url("data:image/svg+xml,<svg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"none\" fill-rule=\"evenodd\"><g fill=\"rgba(255,255,255,0.05)\" fill-opacity=\"0.4\"><circle cx=\"6\" cy=\"6\" r=\"6\"/><circle cx=\"36\" cy=\"6\" r=\"6\"/><circle cx=\"6\" cy=\"36\" r=\"6\"/><circle cx=\"36\" cy=\"36\" r=\"6\"/></g></svg>") repeat;
    animation: ${slideIn} 20s linear infinite;
  }
`;

const RegisterContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 1;
`;

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 480px;
  padding: 3rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  animation: ${fadeIn} 0.8s ease-out;
  max-height: 90vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 0.75rem;
`;

const LogoIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 2rem;
    height: 2rem;
    color: white;
  }
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  z-index: 1;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const StyledInput = styled(Input)`
  padding-left: 3rem;
  transition: all 0.3s;
  
  &:focus {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
  }
`;

const StyledSelect = styled(Select)`
  padding-left: 3rem;
  transition: all 0.3s;
  
  &:focus {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  z-index: 1;
  
  &:hover {
    color: #6b7280;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: ${slideIn} 0.3s ease-out;
`;

const PasswordStrength = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
`;

const StrengthTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
`;

const StrengthItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${props => props.$valid ? "#10b981" : "#64748b"};
  margin-bottom: 0.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
    color: ${props => props.$valid ? "#10b981" : "#d1d5db"};
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  }
`;

const SigninLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  
  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
    
    &:hover {
      color: #1d4ed8;
    }
  }
`;

const OptionalLabel = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: 0.25rem;
`;

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const watchPassword = watch("password", "");
  const watchRole = watch("role", "");

  const passwordRequirements = {
    length: watchPassword.length >= 8,
    uppercase: /[A-Z]/.test(watchPassword),
    lowercase: /[a-z]/.test(watchPassword),
    number: /[0-9]/.test(watchPassword),
    special: /[^A-Za-z0-9]/.test(watchPassword)
  };

  const onSubmit = async (data) => {
    // Build userData object with required fields
    const userData = {
      name: data.name,
      email: data.email,
      role: data.role,
      password: data.password,
    };

    // Add optional fields only if they have values
    if (data.phone && data.phone.trim() !== '') {
      userData.phone = data.phone.trim();
    }

    if (data.company && data.company.trim() !== '') {
      userData.company = data.company.trim();
    }

    if (data.department && data.department.trim() !== '') {
      userData.department = data.department.trim();
    }

    console.log('Submitting user data:', userData);

    const result = await registerUser(userData);

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError("root", { message: result.error });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <RegisterContainer>
      <RegisterContent>
        <RegisterCard>
          <Logo>
            <LogoIcon>
              <Zap />
            </LogoIcon>
            <LogoText>InterviewX</LogoText>
          </Logo>

          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <H2 style={{ margin: "0 0 0.5rem 0" }}>Create Account</H2>
            <Text color="secondary">
              Join InterviewX and start your journey
            </Text>
          </div>

          <Form onSubmit={handleSubmit(onSubmit)}>
            <InputGroup>
              <InputIcon>
                <User />
              </InputIcon>
              <StyledInput
                type="text"
                placeholder="Enter your full name"
                {...register("name", {
                  required: "Name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
              />
              {errors.name && (
                <ErrorMessage>
                  {errors.name.message}
                </ErrorMessage>
              )}
            </InputGroup>

            <InputGroup>
              <InputIcon>
                <Mail />
              </InputIcon>
              <StyledInput
                type="email"
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <ErrorMessage>
                  {errors.email.message}
                </ErrorMessage>
              )}
            </InputGroup>

            <InputGroup>
              <InputIcon>
                <Phone />
              </InputIcon>
              <StyledInput
                type="tel"
                placeholder="Phone number (optional)"
                {...register("phone", {
                  pattern: {
                    value: /^[0-9+\-\s()]*$/,
                    message: "Invalid phone number format",
                  },
                })}
              />
              {errors.phone && (
                <ErrorMessage>
                  {errors.phone.message}
                </ErrorMessage>
              )}
            </InputGroup>

            <InputGroup>
              <InputIcon>
                <Briefcase />
              </InputIcon>
              <StyledSelect
                {...register("role", {
                  required: "Role is required",
                })}
              >
                <option value="">Select your role</option>
                <option value="Candidate">Candidate</option>
                <option value="Recruiter">Recruiter</option>
                <option value="Admin">Admin</option>
              </StyledSelect>

              {errors.role && (
                <ErrorMessage>
                  {errors.role.message}
                </ErrorMessage>
              )}
            </InputGroup>

            {(watchRole === "Recruiter" || watchRole === "Admin") && (
              <>
                <InputGroup>
                  <InputIcon>
                    <Building2 />
                  </InputIcon>
                  <StyledInput
                    type="text"
                    placeholder="Company name (optional)"
                    {...register("company")}
                  />
                </InputGroup>

                <InputGroup>
                  <InputIcon>
                    <Briefcase />
                  </InputIcon>
                  <StyledInput
                    type="text"
                    placeholder="Department (optional)"
                    {...register("department")}
                  />
                </InputGroup>
              </>
            )}

            <InputGroup>
              <InputIcon>
                <Lock />
              </InputIcon>
              <StyledInput
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
              />
              <PasswordToggle
                type="button"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </PasswordToggle>
              {errors.password && (
                <ErrorMessage>
                  {errors.password.message}
                </ErrorMessage>
              )}
            </InputGroup>

            {watchPassword && (
              <PasswordStrength>
                <StrengthTitle>Password Requirements</StrengthTitle>
                <StrengthItem $valid={passwordRequirements.length}>
                  <Check />
                  <span>At least 8 characters</span>
                </StrengthItem>
                <StrengthItem $valid={passwordRequirements.uppercase}>
                  <Check />
                  <span>One uppercase letter</span>
                </StrengthItem>
                <StrengthItem $valid={passwordRequirements.lowercase}>
                  <Check />
                  <span>One lowercase letter</span>
                </StrengthItem>
                <StrengthItem $valid={passwordRequirements.number}>
                  <Check />
                  <span>One number</span>
                </StrengthItem>
                <StrengthItem $valid={passwordRequirements.special}>
                  <Check />
                  <span>One special character</span>
                </StrengthItem>
              </PasswordStrength>
            )}

            {errors.root && (
              <ErrorMessage>
                {errors.root.message}
              </ErrorMessage>
            )}

            <SubmitButton
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </SubmitButton>
          </Form>

          <Divider>
            <Text size="sm" color="secondary">
              or
            </Text>
          </Divider>

          <SigninLink>
            <Text size="sm" color="secondary">
              Already have an account?{" "}
              <Link to="/login">
                Sign in here
              </Link>
            </Text>
          </SigninLink>
        </RegisterCard>
      </RegisterContent>
    </RegisterContainer>
  );
};

export default Register;