
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const start = Date.now();
    const request = new Request(...args);
    const method = request.method;
    const url = request.url;
    
    try {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();
      let bodyData = null;
      try { bodyData = await clonedResponse.json(); } catch (e) { try { bodyData = await clonedResponse.text(); } catch (e2) {} }
      
      const duration = Date.now() - start;
      console.table([{
        Type: 'API Response',
        Method: method,
        URL: url,
        Status: response.status,
        DurationMS: duration,
        ResponseData: typeof bodyData === 'object' ? JSON.stringify(bodyData) : bodyData
      }]);
      return response;
    } catch (error) {
      console.table([{
        Type: 'API Error',
        Method: method,
        URL: url,
        Error: error.message
      }]);
      throw error;
    }
  };

  createRoot(document.getElementById("root")!).render(<App />);
  