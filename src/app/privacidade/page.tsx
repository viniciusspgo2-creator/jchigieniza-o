import type { Metadata } from 'next';
import { getSiteData } from '@/lib/site-content';
import { PageTracker } from '@/components/site/analytics';
import { PublicShell } from '@/components/site/public-shell';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Política de Privacidade',
    description: 'Como a JC Lavagem a Seco coleta, usa e protege seus dados, em conformidade com a LGPD.',
    alternates: { canonical: '/privacidade' },
    robots: { index: true, follow: true },
  };
}

const DEFAULT_SECTIONS = [
  {
    title: '1. Quem somos',
    text: 'A JC Lavagem a Seco é uma empresa de higienização de estofados em geral, com atendimento a domicílio em Goiânia – GO. Esta política explica como tratamos dados pessoais, em cumprimento à Lei Geral de Proteção de Dados Pessoais (LGPD – Lei 13.709/2018). O responsável pelo tratamento dos dados é o titular da empresa.',
  },
  {
    title: '2. Quais dados coletamos',
    text: 'Coletamos apenas o necessário para responder às suas solicitações: nome, número de WhatsApp/telefone, endereço do atendimento (bairro, rua, ponto de referência), data e horário de preferência, observações e fotos que você enviar voluntariamente. Também registramos o histórico de atendimentos e orçamentos quando você se torna cliente.',
  },
  {
    title: '3. Dados de navegação (analytics)',
    text: 'Nosso site mede visitas com ferramentas próprias, sem coletar dados que identifiquem diretamente uma pessoa: contamos visualizações de página, sessões aproximadas (por cookie anônimo e aleatório) e eventos como cliques no botão de WhatsApp. Não fazemos fingerprinting, não vendemos dados e não exibimos publicidade de terceiros. Acessos ao painel administrativo não são contabilizados.',
  },
  {
    title: '4. Para que usamos os dados',
    text: 'Para responder seu contato, avaliar o serviço solicitado, agendar e executar o atendimento, emitir recibos e manter o histórico comercial. As fotos enviadas na solicitação são usadas apenas para avaliação do serviço — elas nunca entram na galeria pública do site sem autorização expressa.',
  },
  {
    title: '5. Compartilhamento',
    text: 'Não compartilhamos, vendemos ou cedemos seus dados a terceiros para fins comerciais. Os dados ficam armazenados em sistema próprio da empresa, com acesso restrito aos operadores que precisam deles para executar o atendimento.',
  },
  {
    title: '6. Retenção e segurança',
    text: 'Mantemos os dados pelo tempo necessário para cumprir as finalidades e obrigações legais (como emissão de recibos). Aplicamos medidas técnicas e organizacionais razoáveis para proteger as informações: acesso ao painel restrito por autenticação, senhas criptografadas e trilha de auditoria das operações administrativas.',
  },
  {
    title: '7. Seus direitos',
    text: 'Você pode solicitar a qualquer momento: confirmação de que tratamos seus dados, acesso a eles, correção, anonimização ou exclusão (quando não houver obrigação legal de retenção) e a portabilidade das informações. Para exercer qualquer um desses direitos, entre em contato pelo WhatsApp (62) 99157-9369 ou pelo Instagram.',
  },
  {
    title: '8. Cookies',
    text: 'Usamos cookies estritamente funcionais: um cookie de sessão para o painel administrativo (somente para operadores autenticados) e um cookie anônimo de métricas de visita (número aleatório, sem dados pessoais). Não usamos cookies de publicidade.',
  },
  {
    title: '9. Atualizações desta política',
    text: 'Esta política pode ser atualizada para refletir mudanças no site ou na legislação. A data da última revisão está indicada no topo desta página. Mudanças relevantes serão comunicadas nos canais oficiais da empresa.',
  },
];

export default async function PrivacyPage() {
  const site = await getSiteData();

  return (
    <PublicShell whatsappIntl={site.contact.whatsappIntl} instagramUrl={site.contact.instagramUrl}>
      <PageTracker />
      <article className="bg-white">
        <header className="bg-deep py-14 text-white sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Política de Privacidade</h1>
            <p className="mt-3 text-sm text-blue-100/85">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>
        <div className="prose-article mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          {DEFAULT_SECTIONS.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
        </div>
      </article>
    </PublicShell>
  );
}
