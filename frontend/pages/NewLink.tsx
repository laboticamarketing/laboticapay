import React from 'react';
import { NewLinkForm } from '../components/NewLinkForm';

export const NewLink: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <NewLinkForm />
    </div>
  );
};