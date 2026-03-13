import { NextRequest, NextResponse } from 'next/server';
import { getDomain } from '@/lib/get-domain';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_PREGUNTAS_BASE_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '';
    const estado = searchParams.get('estado') || '';
    const order = searchParams.get('order') || '';
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (estado) params.append('estado', estado);
    if (order) params.append('order', order);
    const domain = await getDomain();
    params.append('domain', domain);
    const token = request.cookies.get('authToken')?.value;
    const url = `${BACKEND_URL}/api/preguntas${params.toString() ? '?' + params.toString() : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(data?.data?.preguntas || []);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching faqs' }, { status: 500 });
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
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
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
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data);
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
