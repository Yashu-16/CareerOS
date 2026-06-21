/**
 * Lightweight, deterministic skill extraction for ingested job descriptions.
 * This intentionally does NOT call the LLM (ingestion runs frequently and in
 * bulk — that would be slow and costly). The AI-heavy work belongs to the
 * tailoring engine when a *user* opens a *specific* job; ingestion just needs
 * a fast, good-enough tag set for filtering/search.
 */
const SKILL_VOCABULARY = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Golang', 'Rust', 'C++', 'C#', 'Ruby', 'PHP', 'Kotlin', 'Swift',
  'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Node.js', 'Express', 'NestJS', 'Django', 'Flask',
  'FastAPI', 'Spring Boot', 'Ruby on Rails', '.NET',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'SQL', 'NoSQL',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn',
  'Data Analysis', 'Data Engineering', 'ETL', 'Spark', 'Hadoop', 'Airflow', 'Kafka',
  'REST API', 'GraphQL', 'gRPC', 'Microservices', 'System Design',
  'HTML', 'CSS', 'Tailwind CSS', 'Sass',
  'Product Management', 'Project Management', 'Agile', 'Scrum', 'Jira',
  'Sales', 'Business Development', 'Account Management', 'Customer Success',
  'Digital Marketing', 'SEO', 'Content Marketing', 'Growth Marketing',
  'Figma', 'UI/UX Design', 'User Research',
  'Excel', 'PowerBI', 'Tableau', 'Salesforce',
  'Git', 'Linux', 'Bash',
];

export function extractSkillsFromText(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();

  for (const skill of SKILL_VOCABULARY) {
    const pattern = new RegExp(`\\b${escapeRegex(skill.toLowerCase())}\\b`, 'i');
    if (pattern.test(lower)) {
      found.add(skill);
    }
  }

  return Array.from(found);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
