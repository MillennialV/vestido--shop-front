import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_PREGUNTAS_BASE_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '';
    const estado = searchParams.get('estado') || '';
    const order = searchParams.get('order') || '';
    const token = request.cookies.get('authToken')?.value;
    
    // Extraer el dominio (host) de la petición
    let host = request.headers.get('host') || '';
    let domain = host;
    if (domain.includes(':')) {
      domain = domain.split(':')[0]; // remover puerto si existe
    }

    // Si estamos en localhost para pruebas, forzamos www.vestido.shop temporalmente
    if (domain === 'localhost') {
        domain = 'www.vestido.shop';
    }

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (estado) params.append('estado', estado);
    if (order) params.append('order', order);
    if (domain) params.append('domain', domain); // Añadimos el dominio al microservicio

    const url = `${BACKEND_URL}/api/preguntas${params.toString() ? '?' + params.toString() : ''}`;

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
