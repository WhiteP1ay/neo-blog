import Link from 'next/link';
import { tools } from './tools';

export function ToolsPageContent() {
  return (
    <ul>
      {tools.map((tool) => (
        <li key={tool.id}>
          <Link href={tool.href}>{tool.title}</Link>
          <p>{tool.description}</p>
        </li>
      ))}
    </ul>
  );
}
