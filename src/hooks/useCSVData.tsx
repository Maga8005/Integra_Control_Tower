import { useState, useEffect, useCallback } from 'react';

// Interfaces para datos CSV
export interface CSVDataResponse {
  success: boolean;
  data: {
    data: any[];
    metadata: {
      totalRecords: number;
      fields: string[];
      lastUpdated: string;
      fileInfo: {
        exists: boolean;
        size: number;
        sizeFormatted: string;
        lastModified: string;
      };
      processingStats: {
        cacheStatus: string;
        cacheAge: number;
      };
    };
  };
  message: string;
  timestamp: string;
}

export interface CSVFieldsResponse {
  success: boolean;
  data: {
    fields: string[];
    metadata: {
      totalFields: number;
      requiredFields: string[];
      optionalFields: string[];
      lastUpdated: string;
    };
  };
  message: string;
  timestamp: string;
}

export interface ProcessedOperationsResponse {
  success: boolean;
  data: {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
  timestamp: string;
}

export interface UseCSVDataResult {
  // Raw CSV data
  csvData: any[] | null;
  csvFields: string[] | null;
  csvMetadata: CSVDataResponse['data']['metadata'] | null;
  
  // Processed operations
  processedOperations: any[] | null;
  operationsMetadata: any | null;
  
  // Loading states
  isLoadingCSV: boolean;
  isLoadingOperations: boolean;
  
  // Error states
  csvError: string | null;
  operationsError: string | null;
  
  // Actions
  refreshCSVData: () => Promise<void>;
  refreshOperations: () => Promise<void>;
  
  // Utils
  hasData: boolean;
  lastUpdated: string | null;
}

const API_BASE_URL = 'http://localhost:3001';
const ADMIN_KEY = 'admin-dev-key';

export function useCSVData(countryCode: 'CO' | 'MX' = 'CO'): UseCSVDataResult {
  // State for raw CSV data
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [csvFields, setCsvFields] = useState<string[] | null>(null);
  const [csvMetadata, setCsvMetadata] = useState<CSVDataResponse['data']['metadata'] | null>(null);
  
  // State for processed operations
  const [processedOperations, setProcessedOperations] = useState<any[] | null>(null);
  const [operationsMetadata, setOperationsMetadata] = useState<any | null>(null);
  
  // Loading states
  const [isLoadingCSV, setIsLoadingCSV] = useState(false);
  const [isLoadingOperations, setIsLoadingOperations] = useState(false);
  
  // Error states
  const [csvError, setCsvError] = useState<string | null>(null);
  const [operationsError, setOperationsError] = useState<string | null>(null);

  // Helper function to make API requests
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Fetch raw CSV data
  const fetchCSVData = useCallback(async () => {
    setIsLoadingCSV(true);
    setCsvError(null);
    
    try {
      const countryName = countryCode === 'CO' ? 'Colombia' : 'México';
      console.log(`🔄 Fetching CSV data from backend for ${countryName}...`);
      
      // Get country data (includes operations and metadata)
      const countryResponse = await apiRequest(`/api/admin/country-data/${countryCode}`);
      
      if (countryResponse.success) {
        const operations = countryResponse.data?.operations || [];
        setCsvData(operations); // Set operations as CSV data
        
        // Create metadata from country response
        const metadata = {
          totalRecords: operations.length,
          fields: operations.length > 0 ? Object.keys(operations[0]) : [],
          lastUpdated: countryResponse.timestamp,
          fileInfo: {
            exists: operations.length > 0,
            size: JSON.stringify(operations).length,
            sizeFormatted: `${(JSON.stringify(operations).length / 1024).toFixed(2)} KB`,
            lastModified: countryResponse.timestamp
          },
          processingStats: {
            cacheStatus: 'fresh',
            cacheAge: 0
          }
        };
        setCsvMetadata(metadata);
        setCsvFields(metadata.fields);
        
        console.log(`✅ ${countryName} data loaded: ${operations.length} records`);
      } else {
        throw new Error(countryResponse.message || `Failed to fetch ${countryName} data`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCsvError(errorMessage);
      console.error('❌ Error fetching CSV data:', errorMessage);
    } finally {
      setIsLoadingCSV(false);
    }
  }, [countryCode]);

  // Fetch processed operations
  const fetchProcessedOperations = useCallback(async () => {
    setIsLoadingOperations(true);
    setOperationsError(null);
    
    try {
      console.log('🔄 Fetching processed operations from backend...');
      
      const response: ProcessedOperationsResponse = await apiRequest('/api/operations');
      
      if (response.success) {
        setProcessedOperations(response.data.data);
        setOperationsMetadata({
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages
        });
        console.log(`✅ Processed operations loaded: ${response.data.data.length} operations`);
      } else {
        throw new Error(response.message || 'Failed to fetch processed operations');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setOperationsError(errorMessage);
      console.error('❌ Error fetching processed operations:', errorMessage);
    } finally {
      setIsLoadingOperations(false);
    }
  }, []);

  // Refresh functions
  const refreshCSVData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing CSV cache...');
      await apiRequest('/api/admin/csv-refresh', { method: 'POST' });
      await fetchCSVData();
    } catch (error) {
      console.error('❌ Error refreshing CSV data:', error);
      setCsvError(error instanceof Error ? error.message : 'Failed to refresh CSV data');
    }
  }, [fetchCSVData]);

  const refreshOperations = useCallback(async () => {
    try {
      console.log('🔄 Refreshing operations...');
      await apiRequest('/api/operations/reload', { method: 'POST' });
      await fetchProcessedOperations();
    } catch (error) {
      console.error('❌ Error refreshing operations:', error);
      setOperationsError(error instanceof Error ? error.message : 'Failed to refresh operations');
    }
  }, [fetchProcessedOperations]);

  // Initial data fetch
  useEffect(() => {
    fetchCSVData();
    fetchProcessedOperations();
  }, [fetchCSVData, fetchProcessedOperations, countryCode]);

  // Computed values
  const hasData = (csvData && csvData.length > 0) || (processedOperations && processedOperations.length > 0);
  const lastUpdated = csvMetadata?.lastUpdated || operationsMetadata?.lastUpdated || null;

  return {
    // Raw CSV data
    csvData,
    csvFields,
    csvMetadata,
    
    // Processed operations
    processedOperations,
    operationsMetadata,
    
    // Loading states
    isLoadingCSV,
    isLoadingOperations,
    
    // Error states
    csvError,
    operationsError,
    
    // Actions
    refreshCSVData,
    refreshOperations,
    
    // Utils
    hasData,
    lastUpdated,
  };
}