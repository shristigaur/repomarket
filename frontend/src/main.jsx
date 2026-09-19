import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './MarketplaceDashboard';
import ListingCreation from './ListingCreation';
import MyListings from './MyListings';
import AuthCallback from './AuthCallback';
import './styles.css';

const Page = window.location.pathname === '/create'
  ? ListingCreation
  : window.location.pathname === '/my-listings'
    ? MyListings
    : window.location.pathname === '/auth/callback'
      ? AuthCallback
      : App;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
