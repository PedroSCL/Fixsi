/* eslint-disable @next/next/no-img-element -- as imagens locais preservam as proporções do acervo existente */
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronRight,
  Drill,
  Handshake,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";

const categories = [
  {
    name: "Elétrica",
    image: "/img/eletricista.png",
    href: "/services?category=Elétrica",
  },
  {
    name: "Hidráulica",
    image: "/img/encanador.png",
    href: "/services?category=Hidráulica",
  },
  {
    name: "Marcenaria",
    image: "/img/marceneiro.png",
    href: "/services?category=Marcenaria",
  },
  {
    name: "Pintura",
    image: "/img/pintor.png",
    href: "/services?category=Pintura",
  },
  {
    name: "Reformas",
    image: "/img/pedreiro.png",
    href: "/services?category=Reformas",
  },
  { name: "Ferramentas", image: "/img/furadeira.png", href: "/tools" },
];

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#F8F7F4] py-14 sm:py-20">
        <div className="page-shell relative grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <p className="flex items-center gap-3 text-xs font-extrabold uppercase tracking-[.16em] text-[#F97316]">
              <span className="h-px w-9 bg-[#F97316]" />
              Serviços locais para casa e negócio
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#17233B] sm:text-6xl">
              Encontre profissionais.{" "}
              <span className="text-[#F97316]">Contrate com confiança.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#667085]">
              Conte o que precisa, compare opções e combine tudo direto com
              profissionais da sua região.
            </p>
            <form
              action="/services"
              className="mt-8 flex max-w-xl flex-col gap-2 rounded-xl border border-[#D9D4CC] bg-white p-2 shadow-[0_14px_35px_rgba(23,35,59,.09)] sm:flex-row"
            >
              <label className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F97316]"
                  size={20}
                />
                <input
                  name="search"
                  aria-label="Buscar serviço"
                  placeholder="Qual serviço você precisa?"
                  className="h-13 w-full rounded-xl bg-transparent pl-12 pr-4 font-semibold text-[#17233B] outline-none"
                />
              </label>
              <button className="btn-primary h-13 px-6">
                Encontrar profissional <ArrowRight size={18} />
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#667085]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={17} className="text-[#F97316]" /> Perfis e
                avaliações
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle size={17} className="text-[#F97316]" />{" "}
                Negociação pelo chat
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck size={17} className="text-[#F97316]" />{" "}
                Agendamento simples
              </span>
            </div>
          </div>
          <figure className="relative mx-auto w-full max-w-lg py-6">
            <span className="absolute right-2 top-0 h-48 w-48 rounded-full bg-[#FFE2C2]" />
            <span className="absolute bottom-16 left-2 h-24 w-24 rounded-full border-[18px] border-[#17233B]" />
            <img
              src="/img/ferramentas.png"
              alt="Furadeira, chave e martelo representando serviços para casa"
              className="relative mx-auto w-full max-w-[460px] mix-blend-multiply"
            />
            <figcaption className="relative mx-auto mt-3 grid max-w-[460px] grid-cols-3 border-y border-[#D9D4CC] py-4 text-center">
              {["Manutenção", "Reformas", "Ferramentas"].map((item, index) => (
                <span
                  key={item}
                  className={`text-xs font-extrabold uppercase tracking-[.08em] text-[#475467] ${index > 0 ? "border-l border-[#D9D4CC]" : ""}`}
                >
                  {item}
                </span>
              ))}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="page-shell">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Explore por categoria</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
                O que você precisa resolver?
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1 font-bold text-[#F97316]"
            >
              Ver todos os serviços <ChevronRight size={18} />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group overflow-hidden rounded-2xl border border-[#E7E2DA] bg-[#FCFBF9] hover:-translate-y-1 hover:border-[#EFB67D] hover:shadow-lg"
              >
                <div className="h-28 overflow-hidden bg-[#FFF1E8]">
                  <img
                    src={category.image}
                    alt=""
                    className="h-full w-full object-contain p-3 transition group-hover:scale-105"
                  />
                </div>
                <span className="block p-3 text-center text-sm font-extrabold text-[#17233B]">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y border-[#E7E2DA] bg-[#F5F2ED] py-18"
      >
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Como funciona</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
              Do pedido ao serviço concluído, sem complicação
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Search,
                n: "01",
                title: "Encontre",
                text: "Busque pelo serviço e conheça profissionais disponíveis.",
              },
              {
                icon: MessageCircle,
                n: "02",
                title: "Converse e combine",
                text: "Tire dúvidas, receba propostas e escolha com tranquilidade.",
              },
              {
                icon: Handshake,
                n: "03",
                title: "Contrate",
                text: "Agende, acompanhe o pagamento e avalie ao final.",
              },
            ].map(({ icon: Icon, n, title, text }) => (
              <article key={n} className="surface-card relative p-7">
                <span className="absolute right-5 top-4 text-4xl font-extrabold text-[#F2E7DA]">
                  {n}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F97316] text-white">
                  <Icon size={23} />
                </span>
                <h3 className="mt-5 text-xl font-extrabold text-[#17233B]">
                  {title}
                </h3>
                <p className="mt-2 leading-7 text-[#667085]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-18">
        <div className="page-shell grid gap-5 lg:grid-cols-2">
          <article className="rounded-[1.5rem] bg-[#17233B] p-8 text-white sm:p-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#FFB15A]">
              <BriefcaseBusiness size={23} />
            </span>
            <p className="mt-6 text-sm font-extrabold uppercase tracking-[.14em] text-[#FFD2A3]">
              Para profissionais
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em]">
              Transforme seu trabalho em novas oportunidades.
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-[#E7EAF0]">
              Crie seu perfil, publique serviços e negocie diretamente com
              clientes.
            </p>
            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-[#F97316]"
            >
              Quero trabalhar <ArrowRight size={17} />
            </Link>
          </article>
          <article className="rounded-[1.5rem] border border-[#E7E2DA] bg-[#FFF9EA] p-8 sm:p-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFB15A] text-[#17233B]">
              <Drill size={23} />
            </span>
            <p className="mt-6 text-sm font-extrabold uppercase tracking-[.14em] text-[#984B00]">
              Para locadores
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em] text-[#17233B]">
              Sua ferramenta pode gerar renda.
            </h2>
            <p className="mt-4 max-w-lg leading-7 text-[#667085]">
              Cadastre equipamentos, defina o valor da diária e acompanhe os
              aluguéis.
            </p>
            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#17233B] px-5 py-3 font-extrabold text-white"
            >
              Anunciar ferramenta <ArrowRight size={17} />
            </Link>
          </article>
        </div>
      </section>

      <section className="bg-[#F97316] py-14 text-white">
        <div className="page-shell flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[.14em] text-[#FFD2A3]">
              Comece agora
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-.035em]">
              O serviço certo está mais perto do que parece.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/services"
              className="rounded-xl bg-white px-5 py-3 font-extrabold text-[#F97316]"
            >
              Ver profissionais
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-white/30 px-5 py-3 font-extrabold text-white hover:bg-white/10"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#111827] py-8 text-[#B8CBC8]">
        <div className="page-shell flex flex-col justify-between gap-3 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} Serveo. Serviços com confiança.</p>
          <p>Feito para aproximar clientes e profissionais.</p>
        </div>
      </footer>
    </main>
  );
}
