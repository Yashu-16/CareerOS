/** Common skills for Indian tech/finance resumes — used for lexical extraction. */
export const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'React.js', 'Next.js', 'Angular', 'Vue', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI',
  'Spring Boot', 'Spring', 'Hibernate', '.NET', 'ASP.NET',
  'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'DynamoDB', 'Elasticsearch', 'Cassandra', 'Oracle',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'Git', 'Linux', 'REST', 'GraphQL', 'Microservices', 'System Design',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
  'Data Analysis', 'Data Science', 'Power BI', 'Tableau', 'Excel', 'SQL Server',
  'Figma', 'UI/UX', 'Product Management', 'Agile', 'Scrum', 'JIRA',
  'Salesforce', 'SAP', 'DevOps', 'SRE', 'Cybersecurity',
  'Communication', 'Leadership', 'Project Management', 'Business Analysis',
  'Android', 'iOS', 'Flutter', 'React Native',
  'Kafka', 'RabbitMQ', 'Spark', 'Hadoop', 'Airflow', 'dbt',
  'Selenium', 'Cypress', 'Jest', 'JUnit', 'Postman',
  'Blockchain', 'Solidity', 'Web3',
  'NLP', 'Computer Vision', 'LLM', 'OpenAI', 'LangChain',
  'R', 'MATLAB', 'Statistics', 'A/B Testing',
  'Digital Marketing', 'SEO', 'Google Analytics', 'Content Writing',
  'Financial Modeling', 'Accounting', 'Tally', 'GST',
]

/** Pull known skills mentioned in resume text (longest match first to avoid partial hits). */
export function extractSkillsFromText(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  const found = new Set<string>()

  const sorted = [...KNOWN_SKILLS].sort((a, b) => b.length - a.length)
  for (const skill of sorted) {
    const pattern = skill.toLowerCase().replace(/[.+]/g, '\\$&').replace(/\s+/g, '\\s+')
    if (new RegExp(`\\b${pattern}\\b`, 'i').test(lower)) {
      found.add(skill)
    }
  }
  return [...found]
}
