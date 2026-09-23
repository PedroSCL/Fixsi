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
      <section className="relative overflow-hidden bg-[#FFF9F1] py-12 sm:py-18">
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full border-[46px] border-[#FFE6C8] opacity-60" />
        <div className="absolute bottom-10 right-[45%] hidden h-24 w-24 rotate-12 border-2 border-[#F47A00]/15 lg:block" />
        <div className="page-shell relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F0C79E] bg-white px-4 py-2 text-xs font-extrabold text-[#D96500] shadow-[2px_3px_0_rgba(32,54,92,.07)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF0DF] text-[#F47A00]">
                ✦
              </span>
              Serviços para o seu dia a dia
            </p>
            <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-[-.035em] text-[#20365C] sm:text-5xl xl:text-[3.5rem]">
              Encontre profissionais e contrate{" "}
              <span className="relative inline-block text-[#F47A00] after:absolute after:-bottom-1 after:left-0 after:h-2 after:w-full after:-rotate-1 after:bg-[#FFC56E]/45 after:content-['']">
                <span className="relative z-10">serviços</span>
              </span>{" "}
              para tudo o que precisar.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#667085]">
              A Fixsi conecta você a profissionais da sua região com
              praticidade, segurança e uma conversa direta.
            </p>
            <form
              action="/services"
              className="mt-8 flex max-w-xl flex-col gap-2 rounded-xl border-2 border-[#20365C] bg-white p-2 shadow-[5px_6px_0_#F0C79E] sm:flex-row"
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
          <aside className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[1.5rem_1.5rem_1.5rem_.35rem] border-2 border-[#20365C] bg-[#F47A00] p-7 shadow-[10px_12px_0_#20365C] sm:p-10">
            <img
              src="/img/tools-illustration.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-[.13] mix-blend-multiply"
            />
            <div className="relative flex h-20 w-44 items-center justify-center rounded-xl border-2 border-[#20365C] bg-white shadow-[3px_4px_0_rgba(32,54,92,.25)]">
              <img
                src="/img/logofixsi-horizontal-tight.png"
                alt="Fixsi"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="relative mt-10 text-xs font-extrabold uppercase tracking-[.2em] text-white/85">
              Comece por aqui
            </p>
            <h2 className="relative mt-3 max-w-sm text-3xl font-extrabold leading-tight tracking-[-.035em] text-white">
              Qual serviço você está procurando?
            </h2>
            <Link
              href="/services"
              className="relative mt-7 flex items-center justify-between rounded-xl border-2 border-[#20365C] bg-white p-4 font-bold text-[#475467] shadow-[4px_5px_0_rgba(32,54,92,.2)]"
            >
              <span className="flex items-center gap-3">
                <Search size={20} className="text-[#F97316]" /> Buscar
                profissional
              </span>
              <ArrowRight size={18} className="text-[#17233B]" />
            </Link>
            <div className="relative mt-7 grid grid-cols-3 gap-3">
              {["Elétrica", "Limpeza", "Reformas"].map((category) => (
                <Link
                  key={category}
                  href={`/services?category=${encodeURIComponent(category)}`}
                  className="rounded-lg border border-white/55 bg-white/15 p-3 text-center text-xs font-extrabold text-white hover:bg-white hover:text-[#F47A00]"
                >
                  {category}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-[#E7DED2] bg-white py-16">
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
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group overflow-hidden rounded-xl border-2 border-[#DED9D1] bg-white shadow-[3px_4px_0_rgba(32,54,92,.06)] hover:-translate-y-1 hover:border-[#F47A00]"
              >
                <div className="h-28 overflow-hidden border-b border-[#E7DED2] bg-[#FFF5E9]">
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
        className="border-y border-[#DED9D1] bg-[#EEF2F7] py-18"
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
                text: "Agende, acompanhe o serviço e avalie ao final.",
              },
            ].map(({ icon: Icon, n, title, text }) => (
              <article
                key={n}
                className="surface-card relative overflow-hidden p-7 pt-9"
              >
                <span className="absolute left-0 top-0 h-1.5 w-full bg-[#F47A00]" />
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
              Serviços profissionais
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
              Locação de ferramentas
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
          <p>© {new Date().getFullYear()} Fixsi. Serviços com confiança.</p>
          <p>Feito para aproximar clientes e profissionais.</p>
        </div>
      </footer>
    </main>
  );
}
