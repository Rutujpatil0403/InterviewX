// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/Common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-2xl font-semibold text-secondary-900 mt-4">
            Page Not Found
          </h2>
          <p className="text-secondary-600 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/dashboard">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <Button 
            variant="secondary" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="mt-8 text-sm text-secondary-500">
          <p>
            If you think this is an error, please{' '}
            <Link to="/contact" className="text-primary-600 hover:text-primary-700">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
