
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const start = Date.now();
    
    // Merge or set credentials: 'include' to ensure cookies work across ports 8000 -> 8080
    const modifiedInit = {
      ...init,
      credentials: init?.credentials || 'include' as RequestCredentials
    };

    const method = modifiedInit.method || 'GET';
    const url = input.toString();
    
    try {
      const response = await originalFetch(input, modifiedInit);
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
    } catch (error: any) {
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
  
