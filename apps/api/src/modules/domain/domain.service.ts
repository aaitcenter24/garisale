import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DomainService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(domain: string) {
    if (!domain) {
      throw new NotFoundException('Domain parameter required');
    }

    // Lookup strategy: matching slug or website_url
    const parts = domain.split('.');
    const possibleSlug = parts[0];

    const dealer = await this.prisma.dealership.findFirst({
      where: {
        OR: [
          { slug: possibleSlug },
          { website_url: { contains: domain } }
        ]
      }
    });

    if (!dealer) {
      throw new NotFoundException(`No dealership configured for domain: ${domain}`);
    }

    // Return dealership microsite layout configuration
    return {
      dealership_id: dealer.id,
      business_name: dealer.business_name,
      slug: dealer.slug,
      theme: {
        primary_color: dealer.primary_color || '#1e3a8a',
        secondary_color: dealer.secondary_color || '#3b82f6',
        logo_url: dealer.logo_url,
        cover_photo_url: dealer.cover_photo_url,
      },
      contact: {
        phone: dealer.phone,
        email: dealer.email,
        whatsapp: dealer.whatsapp_number,
        address: dealer.address,
        district: dealer.district,
      }
    };
  }
}
