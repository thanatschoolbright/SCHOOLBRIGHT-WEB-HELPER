import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // อ่าน package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // ดึงเวอร์ชัน Next.js
    const nextVersion = packageJson.dependencies?.next?.replace('^', '') || '16.0.0';
    
    return NextResponse.json({
      success: true,
      nextVersion,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      nextVersion: '16.0.0', // fallback
      error: 'Could not read package.json'
    }, { status: 500 });
  }
}