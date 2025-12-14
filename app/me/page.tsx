import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Me",
  description: "Me",
};

export default function MePage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold  mb-2 cursor-pointer hover:text-blue-600 transition-colors">
        Ethan Park
      </h1>

      <ul className="list-none cursor-pointer text-gray-600 text-sm">
        <li>
          <a href="https://github.com/WhiteP1ay">💻 GitHub</a>
        </li>
        <li>
          <a href="https://space.bilibili.com/107889531">📺 Bilibili</a>
        </li>
        <li>
          <a href="mailto:EthanPark2233@gmail.com">📧 Email</a>
        </li>
      </ul>
    </article>
  );
}
