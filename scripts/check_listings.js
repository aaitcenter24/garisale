const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.marketplaceListing.findMany({
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
    }
  });
  console.log("Database Listings (Top 10):", JSON.stringify(listings, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
