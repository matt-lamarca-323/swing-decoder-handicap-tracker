import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      handicapIndex: 12.5,
      rounds: 25,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      handicapIndex: 8.3,
      rounds: 42,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'bob.johnson@example.com',
      name: 'Bob Johnson',
      handicapIndex: 18.7,
      rounds: 15,
    },
  })

  console.log('Created users:', { user1, user2, user3 })
  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
