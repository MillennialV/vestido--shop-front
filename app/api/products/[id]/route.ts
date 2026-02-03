import { inventarioService } from '@/services/inventarioService';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await inventarioService.obtenerDetalleProducto(id);
        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
        );
    }
}
