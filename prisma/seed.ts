import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Hash the default password
  const hashedPassword = await bcrypt.hash('password', 12)

  // Create priorities
  const priorities = await Promise.all([
    prisma.priority.upsert({
      where: { name: 'Low' },
      update: {},
      create: {
        name: 'Low',
        level: 1,
        color: '#10b981',
      },
    }),
    prisma.priority.upsert({
      where: { name: 'Medium' },
      update: {},
      create: {
        name: 'Medium',
        level: 2,
        color: '#f59e0b',
      },
    }),
    prisma.priority.upsert({
      where: { name: 'High' },
      update: {},
      create: {
        name: 'High',
        level: 3,
        color: '#ef4444',
      },
    }),
  ])

    // Create user with hashed password
  const user = await prisma.user.upsert({
    where: { email: 'dananjayahbi@gmail.com' },
    update: {},
    create: {
      email: 'dananjayahbi@gmail.com',
      name: 'Isuru Dananjaya',
      password: hashedPassword,
    },
  })

  // Create sample projects
  const projects = await Promise.all([
    prisma.project.upsert({
      where: { id: 'work-project' },
      update: {},
      create: {
        id: 'work-project',
        name: 'Work Projects',
        description: 'Professional development and work tasks',
        color: '#3b82f6',
        userId: user.id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'health-project' },
      update: {},
      create: {
        id: 'health-project',
        name: 'Health & Fitness',
        description: 'Health, wellness, and fitness goals',
        color: '#10b981',
        userId: user.id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'personal-project' },
      update: {},
      create: {
        id: 'personal-project',
        name: 'Personal Development',
        description: 'Learning, hobbies, and personal growth',
        color: '#8b5cf6',
        userId: user.id,
      },
    }),
    prisma.project.upsert({
      where: { id: 'home-project' },
      update: {},
      create: {
        id: 'home-project',
        name: 'Home & Family',
        description: 'Household tasks and family activities',
        color: '#f59e0b',
        userId: user.id,
      },
    }),
  ])

  // Create sample tasks
  const tasks = await Promise.all([
    // Work tasks
    prisma.task.create({
      data: {
        title: 'Complete Q4 Project Planning',
        description: 'Finalize project roadmap and timeline for Q4 deliverables',
        dueDate: new Date('2024-12-15'),
        status: 'TODO',
        userId: user.id,
        priorityId: priorities[2].id, // High
        projectId: projects[0].id, // Work
      },
    }),
    prisma.task.create({
      data: {
        title: 'Review Team Performance Reports',
        description: 'Analyze team metrics and prepare feedback for quarterly review',
        dueDate: new Date('2024-12-10'),
        status: 'IN_PROGRESS',
        userId: user.id,
        priorityId: priorities[1].id, // Medium
        projectId: projects[0].id, // Work
      },
    }),
    prisma.task.create({
      data: {
        title: 'Update Documentation',
        description: 'Update API documentation and user guides',
        dueDate: new Date('2024-12-05'),
        status: 'TODO',
        userId: user.id,
        priorityId: priorities[0].id, // Low
        projectId: projects[0].id, // Work
      },
    }),
    
    // Health & Fitness tasks
    prisma.task.create({
      data: {
        title: 'Morning Workout Routine',
        description: '30-minute cardio and strength training session',
        dueDate: new Date('2024-12-01'),
        status: 'DONE',
        userId: user.id,
        priorityId: priorities[1].id, // Medium
        projectId: projects[1].id, // Health
      },
    }),
    prisma.task.create({
      data: {
        title: 'Schedule Annual Health Checkup',
        description: 'Book appointments with doctor and dentist',
        dueDate: new Date('2024-12-20'),
        status: 'TODO',
        userId: user.id,
        priorityId: priorities[2].id, // High
        projectId: projects[1].id, // Health
      },
    }),
    prisma.task.create({
      data: {
        title: 'Meal Prep for the Week',
        description: 'Prepare healthy meals for Monday-Friday',
        dueDate: new Date('2024-12-02'),
        status: 'IN_PROGRESS',
        userId: user.id,
        priorityId: priorities[1].id, // Medium
        projectId: projects[1].id, // Health
      },
    }),
    
    // Personal Development tasks
    prisma.task.create({
      data: {
        title: 'Read "Atomic Habits" Book',
        description: 'Complete reading and take notes on key concepts',
        dueDate: new Date('2024-12-25'),
        status: 'IN_PROGRESS',
        userId: user.id,
        priorityId: priorities[0].id, // Low
        projectId: projects[2].id, // Personal
      },
    }),
    prisma.task.create({
      data: {
        title: 'Complete Online React Course',
        description: 'Finish the advanced React patterns course on Udemy',
        dueDate: new Date('2024-12-30'),
        status: 'TODO',
        userId: user.id,
        priorityId: priorities[1].id, // Medium
        projectId: projects[2].id, // Personal
      },
    }),
    prisma.task.create({
      data: {
        title: 'Update Portfolio Website',
        description: 'Add recent projects and refresh design',
        dueDate: new Date('2024-12-18'),
        status: 'TODO',
        userId: user.id,
        priorityId: priorities[1].id, // Medium
        projectId: projects[2].id, // Personal
      },
    }),
    
    // Home & Family tasks
    prisma.task.create({
      data: {
        title: 'Christmas Shopping',
        description: 'Buy gifts for family and friends',
        dueDate: new Date('2024-12-20'),
        status: 'TODO',
        userId: user.id,
        priorityId: priorities[2].id, // High
        projectId: projects[3].id, // Home
      },
    }),
    prisma.task.create({
      data: {
        title: 'Organize Holiday Dinner',
        description: 'Plan menu and invite family members',
        dueDate: new Date('2024-12-22'),
        status: 'TODO',
        userId: user.id,
        priorityId: priorities[1].id, // Medium
        projectId: projects[3].id, // Home
      },
    }),
    prisma.task.create({
      data: {
        title: 'Clean and Organize Garage',
        description: 'Sort items and donate unused belongings',
        dueDate: new Date('2024-12-08'),
        status: 'DONE',
        userId: user.id,
        priorityId: priorities[0].id, // Low
        projectId: projects[3].id, // Home
      },
    }),
  ])

  console.log('Database seeded successfully!')
  console.log('Created priorities:', priorities.length)
  console.log('Created user:', user.name, `(${user.email})`)
  console.log('Created projects:', projects.length)
  console.log('Created tasks:', tasks.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })