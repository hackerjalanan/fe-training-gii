import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css'; // atau './tailwind.css'
import './tailwind.css'; // atau './index.css' sesuai penamaan file kamu

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const observerErrHandler = () => {
  const resizeObserverErr = "ResizeObserver loop completed with undelivered notifications.";
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.toString().includes(resizeObserverErr)) {
      return;
    }
    originalError(...args);
  };
};

observerErrHandler();
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals


reportWebVitals();