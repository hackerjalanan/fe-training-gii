// src/components/useConfirmLeavePage.jsx
import { useEffect, useCallback, useRef } from 'react';

const useConfirmLeavePage = (message, shouldBlock = true, callback = null) => {
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleBeforeUnload = useCallback((event) => {
    if (shouldBlock) {
      // For modern browsers
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  }, [message, shouldBlock]);

  const handlePopState = useCallback((event) => {
    if (shouldBlock) {
      const confirmLeave = window.confirm(message);
      if (!confirmLeave) {
        // Push current location back to history to prevent navigation
        window.history.pushState(null, document.title, window.location.href);
        return;
      }
      
      // Execute callback if provided
      if (callbackRef.current && typeof callbackRef.current === 'function') {
        callbackRef.current();
      }
    }
  }, [message, shouldBlock]);

  const handleHashChange = useCallback((event) => {
    if (shouldBlock) {
      const confirmLeave = window.confirm(message);
      if (!confirmLeave) {
        // Prevent hash change
        event.preventDefault();
        return false;
      }
      
      if (callbackRef.current && typeof callbackRef.current === 'function') {
        callbackRef.current();
      }
    }
  }, [message, shouldBlock]);

  useEffect(() => {
    if (shouldBlock) {
      // Handle browser refresh/close
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Handle browser back/forward buttons
      window.addEventListener('popstate', handlePopState);
      
      // Handle hash changes
      window.addEventListener('hashchange', handleHashChange);
      
      // Push initial state to handle back button properly
      if (window.history.state === null) {
        window.history.replaceState({ preventBack: true }, document.title, window.location.href);
      }

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, [shouldBlock, handleBeforeUnload, handlePopState, handleHashChange]);

  // Return function to manually disable/enable blocking
  const disableBlocking = useCallback(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('hashchange', handleHashChange);
  }, [handleBeforeUnload, handlePopState, handleHashChange]);

  const enableBlocking = useCallback(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
  }, [handleBeforeUnload, handlePopState, handleHashChange]);

  return { 
    disableBlocking, 
    enableBlocking 
  };
};

export default useConfirmLeavePage;