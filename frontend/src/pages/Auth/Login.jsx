import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import styled, { keyframes } from "styled-components";
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../../components/styled/FormElements";
import { Button, Card } from "../../components/styled/Components";
import { H1, H2, Text } from "../../components/styled/Typography";
// import toast from "react-hot-toast";

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

const LoginContainer = styled.div`
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

const LoginContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 1;
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  padding: 3rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  animation: ${fadeIn} 0.8s ease-out;
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
  gap: 1.5rem;
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



const SignupLink = styled.div`
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

const ForgotPassword = styled.div`
  text-align: center;
  margin-top: 1rem;
  
  a {
    color: #6b7280;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
    
    &:hover {
      color: #3b82f6;
    }
  }
`;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data);

    
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
    <LoginContainer>
      <LoginContent>
        <LoginCard>
          <Logo>
            <LogoIcon>
              <Zap />
            </LogoIcon>
            <LogoText>InterviewX</LogoText>
          </Logo>
          
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <H2 style={{ margin: "0 0 0.5rem 0" }}>Welcome Back</H2>
            <Text color="secondary">
              Sign in to your account to continue
            </Text>
          </div>



          <Form onSubmit={handleSubmit(onSubmit)}>
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
                <Lock />
              </InputIcon>
              <StyledInput
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
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

            {errors.root && (
              <ErrorMessage>
                {errors.root.message}
              </ErrorMessage>
            )}

            <SubmitButton
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </SubmitButton>
          </Form>

          <ForgotPassword>
            <Link to="/forgot-password">
              Forgot your password?
            </Link>
          </ForgotPassword>

          <Divider>
            <Text size="sm" color="secondary">
              or
            </Text>
          </Divider>

          <SignupLink>
            <Text size="sm" color="secondary">
              Don`t have an account?{" "}
              <Link to="/register">
                Sign up here
              </Link>
            </Text>
          </SignupLink>
        </LoginCard>
      </LoginContent>
    </LoginContainer>
  );
};

export default Login;
