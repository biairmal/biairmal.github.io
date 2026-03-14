// import Image from "next/image";

const careerStartDate = new Date(2021, 6, 1);

export default function Home() {
  function getAge(date: Date) {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex min-h-screen w-full max-w-7xl flex-col items-center justify-between py-16 px-6 md:py-32 md:px-16 bg-zinc-50 dark:bg-black sm:items-start">
        <div className="flex flex-col space-y-8 text-lg max-w-xl">
          <h1 className="text-5xl font-medium pb-8">Bandana Irmal Abdillah</h1>
          <p className="">
            Hi there! I’m an experienced software engineer based in Jakarta,
            Indonesia, with over {getAge(careerStartDate)} years of experience
            building digital products. I primarily focus on backend development,
            but I’m also comfortable working on frontend applications when
            needed.
          </p>
          <p>
            I currently work at a software house where I collaborate with
            different clients and work with various technologies across multiple
            projects. Before starting my career as a software engineer, I earned
            a Bachelor’s degree in Computer Science from{" "}
            <a>Universitas Padjadjaran</a>. I also occasionally take on
            freelance projects to work on new challenges and continue improving
            my skills.
          </p>
          <p>
            Over the years, I’ve developed experience with various technologies
            and tools while building and maintaining software systems. Some of
            the technologies I’ve worked with include:
          </p>
          <ul>
            <li>
              <b>Backend:</b> .Net Core, Spring Boot (Java), Golang, Node.js
            </li>
            <li>
              <b>Frontend:</b> React.js, Next.js, Blazor, TailwindCSS
            </li>
            <li>
              <b>Database:</b> PostgreSQL, SQLServer, Oracle, CosmosDB, Redis
            </li>
            <li>
              <b>DevOps:</b> Docker, CI/CD Pipelines, Azure, AWS
            </li>
          </ul>
          <p>
            Outside of programming, I enjoy exploring new foods, playing video
            games, and playing my guitar. Feel free to connect with me!
          </p>
        </div>
      </div>
    </div>
  );
}
