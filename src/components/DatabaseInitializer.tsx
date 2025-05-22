'use client';

import { useEffect, useState } from 'react';
import { initializeDatabase, updateHomePageWithAllSections, updateAboutPageWithAllSections, updateProgramsPageWithAllSections } from '../lib/database';

const DatabaseInitializer = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        // Clear the dbInitialized flag to force a re-initialization
        localStorage.removeItem('dbInitialized');
        
        // Initialize the database with default data
        initializeDatabase();
        
        // Update all content pages with their default sections
        updateHomePageWithAllSections();
        updateAboutPageWithAllSections();
        updateProgramsPageWithAllSections();
        
        // Mark as initialized
        setInitialized(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    }
  }, []);

  return null; // This component doesn't render anything
};

export default DatabaseInitializer; 