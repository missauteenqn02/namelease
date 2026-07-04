import { NextResponse } from 'next/server';
import { kvClient, LeaseListing } from '@/lib/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const keys = await kvClient.keys('lease:*');
    
    if (!keys || keys.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const pipeline = kvClient.pipeline();
    for (const key of keys) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();

    // results is an array of LeaseListing
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
