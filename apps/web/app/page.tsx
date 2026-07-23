import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 flex items-center justify-between gap-12">
        {/* Texto */}
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: "#1E3A5F" }}>
            Encontre{" "}
            <span style={{ color: "#F97316" }}>profissionais</span> e contrate{" "}
            <span style={{ color: "#F97316" }}>serviços</span> para tudo o que precisar
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            A Fixsi conecta você aos melhores prestadores de serviços domésticos, com segurança e rapidez.
          </p>
          <Link
            href="/services"
            className="text-white px-8 py-4 rounded-full text-lg font-medium inline-block hover:opacity-90"
            style={{ backgroundColor: "#F97316" }}
          >
            Encontrar profissional agora
          </Link>
        </div>

        {/* Ilustração */}
        <div className="hidden lg:flex rounded-2xl p-12 items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
          <span className="text-8xl">🔧🔨⚡</span>
        </div>
      </section>

      {/* Barra laranja */}
      <div className="h-2 w-full" style={{ backgroundColor: "#F97316" }} />
    </div>
  );
}