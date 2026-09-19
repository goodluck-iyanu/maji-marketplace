'use server'

import { GoogleAuth } from 'google-auth-library'

// Helper to get Google Drive auth
async function getDriveAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  // The private key from the environment variable might have literal \n that we need to convert to actual newlines
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials are not configured.')
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })

  return auth.getClient()
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

    // Initialize resumable upload
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': fileSize.toString(),
        'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://maji.hoberg.com.ng',
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

