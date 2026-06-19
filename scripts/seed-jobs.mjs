import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

const jobs = [
  {
    externalId: 'seed-flipkart-sde1',
    title: 'Software Development Engineer I',
    company: 'Flipkart',
    location: 'Bengaluru, Karnataka, India',
    locationType: 'ONSITE',
    jobType: 'FULLTIME',
    salaryMin: 1800000,
    salaryMax: 2800000,
    salaryCurrency: 'INR',
    description:
      'Join Flipkart\'s Supply Chain team to build large-scale distributed systems that power deliveries across India. You will design, develop, and own services handling millions of requests per day.',
    requirements:
      'B.Tech/B.E. in CS or related field\nStrong DSA and problem-solving skills\nExperience with Java or Go\nUnderstanding of microservices and databases',
    skills: ['Java', 'Data Structures', 'Microservices', 'SQL', 'System Design'],
    applyUrl: 'https://www.flipkartcareers.com/',
    source: 'linkedin',
    postedAt: daysAgo(2),
  },
  {
    externalId: 'seed-razorpay-backend',
    title: 'Backend Engineer',
    company: 'Razorpay',
    location: 'Bengaluru, Karnataka, India',
    locationType: 'HYBRID',
    jobType: 'FULLTIME',
    salaryMin: 2000000,
    salaryMax: 3500000,
    salaryCurrency: 'INR',
    description:
      'Build the payments infrastructure that powers millions of Indian businesses. Work on high-throughput, low-latency systems with strong reliability guarantees.',
    requirements:
      '2+ years backend experience\nProficiency in Go, Java, or Python\nExperience with Kafka, Redis, MySQL\nStrong fundamentals in distributed systems',
    skills: ['Go', 'Kafka', 'Redis', 'MySQL', 'Distributed Systems'],
    applyUrl: 'https://razorpay.com/jobs/',
    source: 'linkedin',
    postedAt: daysAgo(1),
  },
  {
    externalId: 'seed-zomato-frontend',
    title: 'Frontend Engineer (React)',
    company: 'Zomato',
    location: 'Gurugram, Haryana, India',
    locationType: 'ONSITE',
    jobType: 'FULLTIME',
    salaryMin: 1500000,
    salaryMax: 2600000,
    salaryCurrency: 'INR',
    description:
      'Craft delightful, high-performance web experiences used by tens of millions of food lovers. Own end-to-end features on the consumer web platform.',
    requirements:
      '2+ years with React\nStrong JavaScript/TypeScript\nExperience with performance optimization\nEye for UI/UX detail',
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Next.js'],
    applyUrl: 'https://www.zomato.com/careers',
    source: 'linkedin',
    postedAt: daysAgo(3),
  },
  {
    externalId: 'seed-swiggy-data',
    title: 'Data Scientist',
    company: 'Swiggy',
    location: 'Bengaluru, Karnataka, India',
    locationType: 'HYBRID',
    jobType: 'FULLTIME',
    salaryMin: 2200000,
    salaryMax: 3800000,
    salaryCurrency: 'INR',
    description:
      'Use ML to optimize delivery logistics, demand forecasting, and personalization for India\'s largest food delivery platform.',
    requirements:
      'M.Tech/MS or equivalent experience\nStrong Python and ML fundamentals\nExperience with large datasets\nSQL and statistics',
    skills: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Pandas'],
    applyUrl: 'https://careers.swiggy.com/',
    source: 'naukri',
    postedAt: daysAgo(4),
  },
  {
    externalId: 'seed-tcs-graduate',
    title: 'Graduate Trainee - Software Engineer',
    company: 'Tata Consultancy Services',
    location: 'Pune, Maharashtra, India',
    locationType: 'ONSITE',
    jobType: 'FULLTIME',
    salaryMin: 350000,
    salaryMax: 450000,
    salaryCurrency: 'INR',
    description:
      'Kickstart your IT career with TCS. Comprehensive training across Java, cloud, and enterprise systems with placement into client projects.',
    requirements:
      'B.E./B.Tech/MCA 2024-2025 batch\n60%+ throughout academics\nGood communication skills\nWillingness to relocate',
    skills: ['Java', 'SQL', 'Problem Solving', 'Communication'],
    applyUrl: 'https://www.tcs.com/careers',
    source: 'naukri',
    postedAt: daysAgo(5),
  },
  {
    externalId: 'seed-infosys-systems',
    title: 'Systems Engineer',
    company: 'Infosys',
    location: 'Mysuru, Karnataka, India',
    locationType: 'ONSITE',
    jobType: 'FULLTIME',
    salaryMin: 360000,
    salaryMax: 500000,
    salaryCurrency: 'INR',
    description:
      'Join Infosys as a Systems Engineer and work on global digital transformation projects after world-class training at the Mysuru campus.',
    requirements:
      'B.E./B.Tech in any branch\nStrong analytical skills\nBasic programming knowledge',
    skills: ['Java', 'Python', 'SQL', 'Cloud'],
    applyUrl: 'https://www.infosys.com/careers/',
    source: 'naukri',
    postedAt: daysAgo(6),
  },
  {
    externalId: 'seed-cred-android',
    title: 'Android Engineer',
    company: 'CRED',
    location: 'Bengaluru, Karnataka, India',
    locationType: 'ONSITE',
    jobType: 'FULLTIME',
    salaryMin: 2500000,
    salaryMax: 4500000,
    salaryCurrency: 'INR',
    description:
      'Build a premium, buttery-smooth Android experience for India\'s most creditworthy users. Obsess over performance, animation, and craft.',
    requirements:
      '3+ years Android development\nKotlin expertise\nStrong understanding of Jetpack & Compose\nAttention to detail',
    skills: ['Kotlin', 'Android', 'Jetpack Compose', 'MVVM'],
    applyUrl: 'https://careers.cred.club/',
    source: 'linkedin',
    postedAt: daysAgo(2),
  },
  {
    externalId: 'seed-zerodha-intern',
    title: 'Software Engineering Intern',
    company: 'Zerodha',
    location: 'Bengaluru, Karnataka, India',
    locationType: 'ONSITE',
    jobType: 'INTERNSHIP',
    salaryMin: 40000,
    salaryMax: 60000,
    salaryCurrency: 'INR',
    description:
      'Work alongside the team building Kite, India\'s most popular trading platform. Real ownership from day one on systems handling huge volumes.',
    requirements:
      'Strong programming fundamentals\nFamiliarity with Go, Python, or JavaScript\nCurious, self-driven mindset',
    skills: ['Go', 'Python', 'JavaScript', 'PostgreSQL'],
    applyUrl: 'https://zerodha.com/careers/',
    source: 'internshala',
    postedAt: daysAgo(1),
  },
  {
    externalId: 'seed-postman-intern',
    title: 'Product Design Intern',
    company: 'Postman',
    location: 'Remote, India',
    locationType: 'REMOTE',
    jobType: 'INTERNSHIP',
    salaryMin: 35000,
    salaryMax: 50000,
    salaryCurrency: 'INR',
    description:
      'Help shape the API platform used by 30M+ developers worldwide. Collaborate with senior designers on real product features.',
    requirements:
      'Portfolio demonstrating UX thinking\nFigma proficiency\nUnderstanding of design systems',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping'],
    applyUrl: 'https://www.postman.com/company/careers/',
    source: 'linkedin',
    postedAt: daysAgo(3),
  },
  {
    externalId: 'seed-freshworks-contract',
    title: 'DevOps Engineer (Contract)',
    company: 'Freshworks',
    location: 'Chennai, Tamil Nadu, India',
    locationType: 'HYBRID',
    jobType: 'CONTRACT',
    salaryMin: 1800000,
    salaryMax: 2800000,
    salaryCurrency: 'INR',
    description:
      'Own CI/CD pipelines and cloud infrastructure on a 12-month contract. Drive reliability and automation across product teams.',
    requirements:
      '4+ years DevOps experience\nAWS, Kubernetes, Terraform\nStrong scripting skills',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker'],
    applyUrl: 'https://www.freshworks.com/company/careers/',
    source: 'naukri',
    postedAt: daysAgo(7),
  },
  {
    externalId: 'seed-meesho-fullstack',
    title: 'Full Stack Engineer',
    company: 'Meesho',
    location: 'Bengaluru, Karnataka, India',
    locationType: 'HYBRID',
    jobType: 'FULLTIME',
    salaryMin: 1900000,
    salaryMax: 3200000,
    salaryCurrency: 'INR',
    description:
      'Build features that help small businesses and entrepreneurs across Bharat sell online. Work across the stack on high-impact products.',
    requirements:
      '2+ years full-stack experience\nReact and Node.js\nExperience with REST APIs and databases',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs'],
    applyUrl: 'https://www.meesho.io/jobs',
    source: 'linkedin',
    postedAt: daysAgo(2),
  },
  {
    externalId: 'seed-ola-ml',
    title: 'Machine Learning Engineer',
    company: 'Ola',
    location: 'Bengaluru, Karnataka, India',
    locationType: 'ONSITE',
    jobType: 'FULLTIME',
    salaryMin: 2400000,
    salaryMax: 4000000,
    salaryCurrency: 'INR',
    description:
      'Build ML systems for pricing, ETA prediction, and routing at scale for India\'s leading mobility platform.',
    requirements:
      'Strong ML and Python skills\nExperience deploying models to production\nKnowledge of deep learning frameworks',
    skills: ['Python', 'PyTorch', 'Machine Learning', 'MLOps', 'SQL'],
    applyUrl: 'https://www.olacabs.com/careers',
    source: 'linkedin',
    postedAt: daysAgo(4),
  },
]

async function main() {
  let count = 0
  for (const job of jobs) {
    await prisma.job.upsert({
      where: { externalId: job.externalId },
      update: { ...job, isActive: true, scrapedAt: new Date() },
      create: { ...job, isActive: true },
    })
    count++
  }
  console.log(`\n✅ Seeded ${count} real Indian job postings into the database.`)
}

main()
  .catch((e) => {
    console.error('❌ Job seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
