import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default project
  const defaultProject = await prisma.project.create({
    data: {
      title: 'My First Notebook',
      description: 'A collection of sources for learning and research',
    },
  });

  console.log(`Created default project: ${defaultProject.id}`);

  // Create default templates for each generation type
  const generationTypes = [
    { type: 'audio_overview', name: 'Audio Overview', instructions: 'Create an engaging audio discussion between two hosts about the provided sources.' },
    { type: 'video_overview', name: 'Video Overview', instructions: 'Create a video storyboard with narration based on the provided sources.' },
    { type: 'flashcards', name: 'Flashcards', instructions: 'Generate study flashcards with questions and answers from the provided sources.' },
    { type: 'quiz', name: 'Quiz', instructions: 'Create a multiple-choice quiz to test understanding of the provided sources.' },
    { type: 'infographic', name: 'Infographic', instructions: 'Generate a structured infographic highlighting key information from the sources.' },
    { type: 'slide_deck', name: 'Slide Deck', instructions: 'Create a presentation slide deck summarizing the provided sources.' },
  ];

  for (const genType of generationTypes) {
    await prisma.template.create({
      data: {
        projectId: defaultProject.id,
        generationType: genType.type,
        name: genType.name,
        instructions: genType.instructions,
        systemPrompt: `You are an expert content creator. ${genType.instructions} Focus on accuracy and clarity.`,
        isDefault: true,
      },
    });
  }

  console.log('Created default templates');

  // Create some sample sources
  const sampleSources = [
    {
      projectId: defaultProject.id,
      type: 'website' as const,
      title: 'Introduction to Machine Learning',
      url: 'https://example.com/ml-intro',
      faviconUrl: 'https://example.com/favicon.ico',
      extractedText: 'Machine learning is a subset of artificial intelligence...',
    },
    {
      projectId: defaultProject.id,
      type: 'pdf' as const,
      title: 'Research Paper: Deep Learning Advances',
      fileUrl: 'https://storage.example.com/paper.pdf',
      extractedText: 'Recent advances in deep learning have shown...',
    },
    {
      projectId: defaultProject.id,
      type: 'youtube' as const,
      title: 'AI Explained in 10 Minutes',
      url: 'https://youtube.com/watch?v=example',
      thumbnailUrl: 'https://img.youtube.com/vi/example/0.jpg',
      extractedText: 'In this video, we explain the basics of AI...',
    },
  ];

  for (const source of sampleSources) {
    await prisma.source.create({
      data: source,
    });
  }

  console.log('Created sample sources');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
