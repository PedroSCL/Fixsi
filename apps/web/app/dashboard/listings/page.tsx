"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Drill,
  type LucideIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { api, apiErrorMessage, formatCurrency } from "../../lib/api";
import { useRequireRole } from "../../lib/use-require-role";

type ServiceListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceFrom: number | string | null;
  images: string[];
};

type ToolListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay: number | string;
  images: string[];
};

export default function ListingsPage() {
  const allowed = useRequireRole("PROFESSIONAL");
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [tools, setTools] = useState<ToolListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  async function loadListings() {
    setError("");
    setLoading(true);
    try {
      const [{ data: servicesData }, { data: toolsData }] = await Promise.all([
        api.get("/services/mine"),
        api.get("/tools/mine"),
      ]);
      setServices(servicesData.services ?? []);
      setTools(toolsData.tools ?? []);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Não foi possível carregar seus anúncios."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) void loadListings();
  }, [allowed]);

  async function removeListing(type: "service" | "tool", id: string, title: string) {
    const label = type === "service" ? "serviço" : "ferramenta";
    if (
      !window.confirm(
        `Excluir o anúncio “${title}”? Ele deixará de aparecer para clientes, mas o histórico de pedidos será preservado.`,
      )
    ) {
      return;
    }

    setError("");
    setRemoving(`${type}-${id}`);
    try {
      await api.delete(type === "service" ? `/services/${id}` : `/tools/${id}`);
      if (type === "service") {
        setServices((current) => current.filter((item) => item.id !== id));
      } else {
        setTools((current) => current.filter((item) => item.id !== id));
      }
    } catch (err: unknown) {
      setError(apiErrorMessage(err, `Não foi possível excluir este ${label}.`));
    } finally {
      setRemoving(null);
    }
  }

  if (!allowed) {
    return (
      <div className="flex min-h-96 items-center justify-center text-[#667085]">
        Verificando acesso...
      </div>
    );
  }

  return (
    <main className="page-shell max-w-5xl py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#F97316]"
      >
        <ArrowLeft size={17} /> Voltar ao dashboard
      </Link>

      <section className="mt-6 surface-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Área profissional</p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#17233B]">
              Meus anúncios
            </h1>
            <p className="mt-2 max-w-2xl text-[#667085]">
              Atualize suas informações ou retire um anúncio da visualização pública.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/services/new" className="btn-secondary text-sm">
              <Plus size={17} /> Serviço
            </Link>
            <Link href="/dashboard/tools/new" className="btn-primary text-sm">
              <Plus size={17} /> Ferramenta
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-14 text-center text-[#667085]">Carregando seus anúncios...</p>
        ) : (
          <div className="mt-8 space-y-10">
            <ListingSection
              title="Serviços"
              emptyText="Você ainda não publicou nenhum serviço."
              icon={BriefcaseBusiness}
              actionHref="/dashboard/services/new"
              actionText="Publicar serviço"
            >
              {services.map((service) => (
                <ListingCard
                  key={service.id}
                  title={service.title}
                  description={service.description}
                  category={service.category}
                  value={service.priceFrom == null ? "Valor a combinar" : `A partir de ${formatCurrency(service.priceFrom)}`}
                  image={service.images[0]}
                  editHref={`/dashboard/services/${service.id}/edit`}
                  removing={removing === `service-${service.id}`}
                  onRemove={() => void removeListing("service", service.id, service.title)}
                />
              ))}
            </ListingSection>

            <ListingSection
              title="Ferramentas"
              emptyText="Você ainda não anunciou nenhuma ferramenta."
              icon={Drill}
              actionHref="/dashboard/tools/new"
              actionText="Anunciar ferramenta"
            >
              {tools.map((tool) => (
                <ListingCard
                  key={tool.id}
                  title={tool.title}
                  description={tool.description}
                  category={tool.category}
                  value={`${formatCurrency(tool.pricePerDay)} por dia`}
                  image={tool.images[0]}
                  editHref={`/dashboard/tools/${tool.id}/edit`}
                  removing={removing === `tool-${tool.id}`}
                  onRemove={() => void removeListing("tool", tool.id, tool.title)}
                />
              ))}
            </ListingSection>
          </div>
        )}
      </section>
    </main>
  );
}

function ListingSection({
  title,
  emptyText,
  icon: Icon,
  actionHref,
  actionText,
  children,
}: {
  title: string;
  emptyText: string;
  icon: LucideIcon;
  actionHref: string;
  actionText: string;
  children: ReactNode;
}) {
  const hasItems = Array.isArray(children) && children.length > 0;
  return (
    <section>
      <div className="flex items-center gap-3 border-b border-[#E7E2DA] pb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1E8] text-[#F97316]">
          <Icon size={20} />
        </span>
        <h2 className="flex-1 text-xl font-extrabold text-[#17233B]">{title}</h2>
      </div>
      {hasItems ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#DED9D1] bg-[#FFFCF8] p-5 text-sm text-[#667085]">
          {emptyText}{" "}
          <Link href={actionHref} className="font-bold text-[#D96500] hover:underline">
            {actionText}
          </Link>
        </div>
      )}
    </section>
  );
}

function ListingCard({
  title,
  description,
  category,
  value,
  image,
  editHref,
  removing,
  onRemove,
}: {
  title: string;
  description: string;
  category: string;
  value: string;
  image?: string;
  editHref: string;
  removing: boolean;
  onRemove: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border-2 border-[#DED9D1] bg-white">
      {image && (
        <img src={image} alt="" className="h-32 w-full object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-[#FFF1E8] px-2.5 py-1 text-xs font-bold text-[#D96500]">
              {category}
            </span>
            <h3 className="mt-3 font-extrabold text-[#17233B]">{title}</h3>
          </div>
          <strong className="shrink-0 text-sm text-[#D96500]">{value}</strong>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-[#667085]">{description}</p>
        <div className="mt-5 flex gap-2 border-t border-[#EEEAE4] pt-4">
          <Link href={editHref} className="btn-secondary flex-1 text-sm">
            <Pencil size={16} /> Editar
          </Link>
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
            aria-label={`Excluir ${title}`}
          >
            <Trash2 size={17} />
            <span className="hidden sm:inline">{removing ? "Excluindo..." : "Excluir"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
