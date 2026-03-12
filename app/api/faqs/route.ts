import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_PREGUNTAS_BASE_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.cookies.get('authToken')?.value;
    
    if (!searchParams.has('domain')) {
        let host = request.headers.get('host') || '';
        if (host.includes(':')) host = host.split(':')[0];
        if (host === 'localhost') host = 'vestido.shop';
        searchParams.append('domain', host);
    } else if (searchParams.get('domain') === 'localhost') {
        searchParams.set('domain', 'vestido.shop');
    }

    const url = `${BACKEND_URL}/api/preguntas?${searchParams.toString()}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('Backend FAQ Fetch Error:', { status: res.status, body: errorData });
      throw new Error(`Failed to fetch faqs: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data?.data?.preguntas || []);
  } catch (error: any) {
    console.error('API /api/faqs Error:', error);
    return NextResponse.json({ error: 'Error fetching faqs', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.cookies.get('authToken')?.value;
    const res = await fetch(`${BACKEND_URL}/api/preguntas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorData = await res.text();
      try {
        const parsedError = JSON.parse(errorData);
        return NextResponse.json(parsedError, { status: res.status });
      } catch {
        return NextResponse.json({ error: 'Failed to create faq', details: errorData }, { status: res.status });
      }
    }
    const data = await res.json();

    return NextResponse.json(data?.data || {});
  } catch (error) {
    return NextResponse.json({ error: 'Error creating faq' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const token = request.cookies.get('authToken')?.value;
    const res = await fetch(`${BACKEND_URL}/api/preguntas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const errorData = await res.text();
      try {
        const parsedError = JSON.parse(errorData);
        return NextResponse.json(parsedError, { status: res.status });
      } catch {
        return NextResponse.json({ error: 'Failed to update faq', details: errorData }, { status: res.status });
      }
    }
    const data = await res.json();
    return NextResponse.json(data?.data || {});
  } catch (error) {
    return NextResponse.json({ error: 'Error updating faq' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const token = request.cookies.get('authToken')?.value;
    const res = await fetch(`${BACKEND_URL}/api/preguntas/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const errorData = await res.text();
      console.log('DELETE Error Response:', { status: res.status, body: errorData });
      throw new Error('Failed to delete faq');
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting faq' }, { status: 500 });
  }
}
