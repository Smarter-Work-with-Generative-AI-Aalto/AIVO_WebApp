// components/research/LoadingSkeleton.tsx
import React from 'react';
import Card from '../shared/Card';

const LoadingSkeleton = () => (
  <div className="p-6">
    <Card>
      <Card.Body>
        <div className="skeleton h-6 w-1/3 mb-4"></div>
        <div className="skeleton h-4 w-1/2 mb-2"></div>
        <div className="skeleton h-4 w-2/3 mb-2"></div>
        <div className="skeleton h-4 w-1/3 mb-2"></div>
        <div className="skeleton h-4 w-1/4 mb-6"></div>
        <div className="skeleton h-4 w-full mb-4"></div>
        <div className="skeleton h-4 w-full mb-4"></div>
        <div className="skeleton h-4 w-full mb-4"></div>
      </Card.Body>
    </Card>
  </div>
);

export default LoadingSkeleton;
