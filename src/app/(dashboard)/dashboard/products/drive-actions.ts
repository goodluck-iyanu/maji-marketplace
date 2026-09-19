'use server'

import { OAuth2Client } from 'google-auth-library'
import { headers } from 'next/headers'

// Helper to get Google Drive auth using OAuth 2.0 (User Quota)
async function getDriveAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive OAuth credentials are not configured.')
  }

  const auth = new OAuth2Client(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })

  return auth
}

/**
 * Creates a resumable upload session in Google Drive and returns the upload URL.
 * The client can then use this URL to PUT the file directly to Google Drive.
 */
export async function getResumableUploadUrl(fileName: string, mimeType: string, fileSize: number) {
  try {
    const client = await getDriveAuth()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!folderId) {
      throw new Error('Google Drive Folder ID is not configured.')
    }

    const accessToken = await client.getAccessToken()

    const metadata = {
      name: fileName,
      parents: [folderId],
    }
    
    // Get the exact origin the browser is using to prevent CORS mismatch
    const headersList = await headers()
    let requestOrigin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://maji.hoberg.com.ng'
    
    // Force HTTPS in production just in case the env var accidentally has http://
    if (!requestOrigin.startsWith('http://localhost') && requestOrigin.startsWith('http://')) {
      requestOrigin = requestOrigin.replace('http://', 'https://')
    }

    // Initialize resumable upload
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': fileSize.toString(),
        'Origin': requestOrigin,
      },
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create resumable upload:', errorText)
      return { error: 'Failed to initialize upload with Google Drive.' }
    }

    // The Location header contains the resumable upload URL
    const uploadUrl = response.headers.get('Location')
    
    if (!uploadUrl) {
      return { error: 'Did not receive an upload URL from Google Drive.' }
    }

    return { uploadUrl }
  } catch (err: any) {
    console.error('Error in getResumableUploadUrl:', err)
    return { error: err.message || 'An error occurred while setting up the upload.' }
  }
}

