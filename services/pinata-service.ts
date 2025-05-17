/**
 * Pinata IPFS service for uploading and pinning files and JSON
 * Production implementation with proper authentication and error handling
 */
import axios from 'axios';
import { PINATA_API_KEY, PINATA_API_SECRET, PINATA_JWT, PINATA_GATEWAY_URL } from '@/lib/env';

/**
 * Alias for storeFileOnPinata to maintain compatibility
 * @param file File to upload
 * @param name Custom name for the file (optional)
 * @returns CID of the uploaded file
 */
export const uploadFileToPinata = storeFileOnPinata;

/**
 * Fetches JSON data from Pinata IPFS
 * @param cid Content identifier (CID) of the JSON data
 * @returns Parsed JSON data
 */
export async function fetchFromPinata<T = any>(cid: string): Promise<T> {
  console.log(`Fetching data from Pinata with CID: ${cid}`);
  
  try {
    const url = getPinataUrl(cid);
    const response = await axios.get(url);
    
    console.log('Data fetched from Pinata successfully');
    return response.data as T;
  } catch (error) {
    console.error('Error fetching data from Pinata:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Pinata fetch failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to fetch data from Pinata: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gets the full URL for a Pinata IPFS resource
 * @param cid Content identifier (CID) of the resource
 * @returns Full URL to access the resource
 */
export function getPinataUrl(cid: string): string {
  if (!cid) return '';
  return `${PINATA_GATEWAY_URL}/${cid}`;
}

/**
 * Stores a user profile to IPFS
 * @param profileData User profile data
 * @param address User wallet address
 * @returns CID of the stored profile
 */
export async function storeUserProfile(profileData: any, address: string): Promise<string> {
  return storeJsonOnPinata(profileData, `haus-user-${address}`);
}

/**
 * Uploads a file to Pinata IPFS
 * @param file File to upload
 * @param name Custom name for the file (optional)
 * @returns CID of the uploaded file
 */
export async function storeFileOnPinata(
  file: File,
  name?: string
): Promise<string> {
  console.log(`Uploading file to Pinata: ${name || file.name}`, {
    fileSize: file.size,
    fileType: file.type
  });

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata if name is provided
    if (name) {
      formData.append('pinataMetadata', JSON.stringify({
        name: name
      }));
    }
    
    let headers = {};
    
    // Use JWT if available, otherwise use API key and secret
    if (PINATA_JWT) {
      console.log('Using JWT authentication for Pinata');
      headers = {
        'Authorization': `Bearer ${PINATA_JWT}`
      };
    } else if (PINATA_API_KEY && PINATA_API_SECRET) {
      console.log('Using API key authentication for Pinata');
      headers = {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
      };
    } else {
      throw new Error('No Pinata authentication credentials provided');
    }
    
    console.log('Sending file to Pinata...');
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('File uploaded to Pinata successfully', response.data);
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Pinata upload failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to upload file to Pinata: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Uploads JSON data to Pinata IPFS
 * @param jsonData JSON data to upload
 * @param name Custom name for the data
 * @returns CID of the uploaded JSON
 */
export async function storeJsonOnPinata(
  jsonData: any,
  name: string
): Promise<string> {
  console.log(`Storing JSON on Pinata: ${name}`);
  
  try {
    // Prepare the JSON data with metadata
    const data = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: name
      }
    };
    
    let headers = {};
    
    // Use JWT if available, otherwise use API key and secret
    if (PINATA_JWT) {
      console.log('Using JWT authentication for Pinata');
      headers = {
        'Authorization': `Bearer ${PINATA_JWT}`
      };
    } else if (PINATA_API_KEY && PINATA_API_SECRET) {
      console.log('Using API key authentication for Pinata');
      headers = {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET
      };
    } else {
      throw new Error('No Pinata authentication credentials provided');
    }
    
    console.log('Sending JSON to Pinata...');
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data,
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('JSON uploaded to Pinata successfully', response.data);
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Pinata JSON upload failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to upload JSON to Pinata: ${error instanceof Error ? error.message : String(error)}`);
  }
}