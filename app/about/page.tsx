export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Sobre o Planeja+</h1>

      <div className="prose max-w-none">
        <p className="text-xl mb-8">
          O Planeja+ é uma plataforma completa para organização de eventos, desenvolvida para simplificar o planejamento
          e tornar cada momento especial.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Nossa Missão</h2>
        <p>
          Nossa missão é tornar a organização de eventos uma experiência simples e agradável. Acreditamos que o tempo
          deve ser gasto aproveitando os momentos especiais, não se preocupando com a logística.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Nossa História</h2>
        <p>
          O Planeja+ nasceu da frustração de seus fundadores ao organizar eventos colaborativos. Percebemos que havia
          uma necessidade de uma ferramenta que facilitasse a divisão de responsabilidades e custos, mantendo todos
          informados e organizados.
        </p>
        <p>
          Lançado em 2023, o Planeja+ rapidamente se tornou a escolha preferida para organização de eventos entre amigos
          e familiares, com foco especial em churrascos, festas de aniversário e encontros casuais.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Nossos Valores</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Simplicidade:</strong> Acreditamos que a tecnologia deve simplificar a vida, não complicá-la.
          </li>
          <li>
            <strong>Colaboração:</strong> Facilitamos a colaboração entre pessoas para criar momentos especiais.
          </li>
          <li>
            <strong>Transparência:</strong> Promovemos a transparência na divisão de responsabilidades e custos.
          </li>
          <li>
            <strong>Inovação:</strong> Buscamos constantemente novas formas de melhorar a experiência de organização de
            eventos.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Nossa Equipe</h2>
        <p>
          Somos uma equipe apaixonada por tecnologia e por criar experiências memoráveis. Nossos desenvolvedores,
          designers e especialistas em experiência do usuário trabalham juntos para oferecer a melhor plataforma de
          organização de eventos.
        </p>

        <div className="bg-emerald-50 p-6 rounded-lg mt-8 border border-emerald-100">
          <h3 className="text-xl font-semibold text-emerald-800 mb-3">Entre em contato</h3>
          <p className="text-emerald-700">
            Tem alguma dúvida ou sugestão? Adoraríamos ouvir você! Entre em contato pelo email
            <a href="mailto:contato@planejaplus.com" className="text-emerald-600 font-medium">
              {" "}
              contato@planejaplus.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
