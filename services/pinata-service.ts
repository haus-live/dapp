import axios from 'axios';
import { 
  PINATA_API_KEY, 
  PINATA_API_SECRET, 
  PINATA_JWT, 
  PINATA_URL, 
  PINATA_GATEWAY_URL 
} from '@/lib/env';

/**
 * Uploads a file to IPFS via Pinata
 * @param file File to upload
 * @param name Name for the file
 * @returns CID (Content Identifier) of the uploaded file
 */
export async function uploadFileToPinata(file: File, name: string): Promise<string> {
  console.log(`Uploading file to Pinata: ${name}`, { fileSize: file.size, fileType: file.type });
  
  try {
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name,
      keyvalues: {
        app: 'haus-live',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Use JWT authentication if available, otherwise use API key/secret
    const headers: Record<string, string> = {};
    
    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
      console.log("Using JWT authentication for Pinata");
    } else if (PINATA_API_KEY && PINATA_API_SECRET) {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_API_SECRET;
      console.log("Using API key authentication for Pinata");
    } else {
      throw new Error("No Pinata credentials found");
    }
    
    // Make the API request
    console.log("Sending file to Pinata...");
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata API error:", errorText);
      throw new Error(`Pinata API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("File uploaded to Pinata successfully", result);
    
    return result.IpfsHash;
  } catch (error) {
    console.error("Error uploading file to Pinata:", error);
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Stores JSON data on IPFS via Pinata
 * @param jsonData JSON data to store
 * @param name Name for the JSON file
 * @returns CID (Content Identifier) of the uploaded JSON
 */
export async function storeJsonOnPinata(jsonData: any, name: string): Promise<string> {
  console.log(`Storing JSON on Pinata: ${name}`);
  
  try {
    // Prepare the data for the API request
    const data = JSON.stringify({
      pinataContent: jsonData,
      pinataMetadata: {
        name,
        keyvalues: {
          app: 'haus-live',
          timestamp: Date.now().toString()
        }
      }
    });
    
    // Use JWT authentication if available, otherwise use API key/secret
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
      console.log("Using JWT authentication for Pinata");
    } else if (PINATA_API_KEY && PINATA_API_SECRET) {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_API_SECRET;
      console.log("Using API key authentication for Pinata");
    } else {
      throw new Error("No Pinata credentials found");
    }
    
    // Make the API request
    console.log("Sending JSON to Pinata...");
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers,
      body: data
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata API error:", errorText);
      throw new Error(`Pinata API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("JSON uploaded to Pinata successfully", result);
    
    return result.IpfsHash;
  } catch (error) {
    console.error("Error storing JSON on Pinata:", error);
    throw new Error(`Failed to store JSON on IPFS: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gets the status of a file on Pinata by its CID
 * @param cid CID (Content Identifier) of the file
 * @returns Pin status information
 */
export async function getPinStatus(cid: string): Promise<any> {
  console.log(`Getting pin status for CID: ${cid}`);
  
  try {
    // Use JWT authentication if available, otherwise use API key/secret
    const headers: Record<string, string> = {};
    
    if (PINATA_JWT) {
      headers['Authorization'] = `Bearer ${PINATA_JWT}`;
    } else if (PINATA_API_KEY && PINATA_API_SECRET) {
      headers['pinata_api_key'] = PINATA_API_KEY;
      headers['pinata_secret_api_key'] = PINATA_API_SECRET;
    } else {
      throw new Error("No Pinata credentials found");
    }
    
    // Make the API request
    const response = await fetch(`https://api.pinata.cloud/pinning/pinJobs?ipfs_pin_hash=${cid}`, {
      method: 'GET',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error getting pin status:", error);
    throw error;
  }
}

/**
 * Get data from IPFS via Pinata gateway
 * @param cid The IPFS CID to fetch
 * @returns The data at the given CID
 */
export async function fetchFromPinata<T>(cid: string): Promise<T> {
  try {
    const response = await axios.get<T>(`${PINATA_GATEWAY_URL}/${cid}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching data from Pinata:', error);
    throw error;
  }
}

/**
 * Get the gateway URL for a CID
 * @param cid The IPFS CID
 * @returns The full gateway URL
 */
export function getPinataUrl(cid: string): string {
  return `${PINATA_GATEWAY_URL}/${cid}`;
} 