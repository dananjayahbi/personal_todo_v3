import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const fileName = data.get('fileName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create assets directory if it doesn't exist
    const assetsPath = join(process.cwd(), 'public', 'assets')
    if (!existsSync(assetsPath)) {
      await mkdir(assetsPath, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${fileName || 'file'}_${Date.now()}.${fileExtension}`
    const filePath = join(assetsPath, uniqueFileName)

    // Write the file
    await writeFile(filePath, buffer)

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      path: `/assets/${uniqueFileName}`,
      fileName: uniqueFileName
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
